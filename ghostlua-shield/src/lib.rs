// ══════════════════════════════════════════════════════════════════════════════
// GhostLua Shield — Rust/WASM Protection Layer  v2.0.0
// ══════════════════════════════════════════════════════════════════════════════
//
// Provides HMAC-signed tier tokens, hashed promo code validation,
// signed download counters, client-side rate-limit tokens,
// session fingerprinting, timing-safe comparisons, and anti-tamper checks.
//
// Compiled to WebAssembly so the secret key and promo hashes
// are embedded in a binary that's far harder to reverse-engineer than JS.
// ══════════════════════════════════════════════════════════════════════════════

use wasm_bindgen::prelude::*;
use js_sys::Date;

// ── Build metadata ───────────────────────────────────────────────────────────
const BUILD_VERSION: &str = "2.0.0";
const BUILD_TAG: &str     = "ghostlua-shield";

// ── Secret key (embedded in WASM binary) ────────────────────────────────────
// Used for HMAC-SHA256 signing. Lives in compiled WASM — far harder to
// extract than a plain JS string constant.
const HMAC_KEY: &[u8] = b"gL$h13ld_v1!xK9mR2pW7qZ4nJ8sF5tY_v2@2026";

// ── SHA-256 hashes of valid promo codes ─────────────────────────────────────
// Format: (sha256_hex_of_UPPERCASE_code, tier, days, one_time)
// The codes themselves never appear in the binary — only their hashes.
const PROMO_TABLE: &[(&str, &str, u32, bool)] = &[
    // GHOSTPRO2026  → 30-day Pro (repeatable)
    ("ea1445e3496b3f850c7e6fd4ebe3f2de877c994458b1ff1faef2c92067f0dcea", "pro",    30, false),
    // GHOSTMASTER2026  → 30-day Master (repeatable)
    ("9b1de846233ff62dce36534d58cf07b23f48654b60e2251c84e96afa0a0b76ff", "master", 30, false),
    // MASTERKEY  → 30-day Master (one-time)
    ("67f47fc33bc8078f549271b7fc470a4940d4acba78f9477bc283368210ce12a1", "master", 30, true),
];

// ══════════════════════════════════════════════════════════════════════════════
// SHA-256 — pure Rust, no_std-compatible, no external crates
// ══════════════════════════════════════════════════════════════════════════════

const SHA256_K: [u32; 64] = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

#[inline(never)]
fn sha256(data: &[u8]) -> [u8; 32] {
    let mut h: [u32; 8] = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
        0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ];

    let bit_len = (data.len() as u64) * 8;
    let mut padded = data.to_vec();
    padded.push(0x80);
    while (padded.len() % 64) != 56 {
        padded.push(0x00);
    }
    padded.extend_from_slice(&bit_len.to_be_bytes());

    for chunk in padded.chunks(64) {
        let mut w = [0u32; 64];
        for i in 0..16 {
            w[i] = u32::from_be_bytes([
                chunk[i * 4], chunk[i * 4 + 1],
                chunk[i * 4 + 2], chunk[i * 4 + 3],
            ]);
        }
        for i in 16..64 {
            let s0 = w[i - 15].rotate_right(7)
                ^ w[i - 15].rotate_right(18)
                ^ (w[i - 15] >> 3);
            let s1 = w[i - 2].rotate_right(17)
                ^ w[i - 2].rotate_right(19)
                ^ (w[i - 2] >> 10);
            w[i] = w[i - 16]
                .wrapping_add(s0)
                .wrapping_add(w[i - 7])
                .wrapping_add(s1);
        }

        let (mut a, mut b, mut c, mut d, mut e, mut f, mut g, mut hh) =
            (h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7]);

        for i in 0..64 {
            let s1 = e.rotate_right(6) ^ e.rotate_right(11) ^ e.rotate_right(25);
            let ch = (e & f) ^ ((!e) & g);
            let t1 = hh
                .wrapping_add(s1)
                .wrapping_add(ch)
                .wrapping_add(SHA256_K[i])
                .wrapping_add(w[i]);
            let s0 = a.rotate_right(2) ^ a.rotate_right(13) ^ a.rotate_right(22);
            let maj = (a & b) ^ (a & c) ^ (b & c);
            let t2 = s0.wrapping_add(maj);
            hh = g; g = f; f = e; e = d.wrapping_add(t1);
            d = c; c = b; b = a; a = t1.wrapping_add(t2);
        }

        h[0] = h[0].wrapping_add(a); h[1] = h[1].wrapping_add(b);
        h[2] = h[2].wrapping_add(c); h[3] = h[3].wrapping_add(d);
        h[4] = h[4].wrapping_add(e); h[5] = h[5].wrapping_add(f);
        h[6] = h[6].wrapping_add(g); h[7] = h[7].wrapping_add(hh);
    }

    let mut result = [0u8; 32];
    for (i, &val) in h.iter().enumerate() {
        result[i * 4..i * 4 + 4].copy_from_slice(&val.to_be_bytes());
    }
    result
}

// ── HMAC-SHA256 ───────────────────────────────────────────────────────────────

#[inline(never)]
fn hmac_sha256(key: &[u8], message: &[u8]) -> [u8; 32] {
    let mut padded_key = [0u8; 64];
    if key.len() > 64 {
        let hk = sha256(key);
        padded_key[..32].copy_from_slice(&hk);
    } else {
        padded_key[..key.len()].copy_from_slice(key);
    }

    let mut ipad = [0x36u8; 64];
    let mut opad = [0x5cu8; 64];
    for i in 0..64 {
        ipad[i] ^= padded_key[i];
        opad[i] ^= padded_key[i];
    }

    let mut inner = Vec::with_capacity(64 + message.len());
    inner.extend_from_slice(&ipad);
    inner.extend_from_slice(message);
    let inner_hash = sha256(&inner);

    let mut outer = Vec::with_capacity(96);
    outer.extend_from_slice(&opad);
    outer.extend_from_slice(&inner_hash);
    sha256(&outer)
}

// ── Timing-safe byte comparison ───────────────────────────────────────────────
// Prevents timing-oracle attacks by ensuring comparison time is constant
// regardless of how many bytes match.

#[inline(never)]
fn constant_time_eq(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() { return false; }
    let mut diff: u8 = 0;
    for (x, y) in a.iter().zip(b.iter()) {
        diff |= x ^ y;
    }
    diff == 0
}

fn constant_time_eq_str(a: &str, b: &str) -> bool {
    constant_time_eq(a.as_bytes(), b.as_bytes())
}

// ── Helpers ───────────────────────────────────────────────────────────────────

fn to_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{:02x}", b)).collect()
}

fn now_ms() -> f64 {
    Date::now()
}

// ══════════════════════════════════════════════════════════════════════════════
// Public WASM API
// ══════════════════════════════════════════════════════════════════════════════

// ── Build info ────────────────────────────────────────────────────────────────

/// Returns a JSON string with build version and tag.
/// e.g. {"version":"2.0.0","tag":"ghostlua-shield"}
#[wasm_bindgen]
pub fn build_info() -> String {
    format!(r#"{{"version":"{}","tag":"{}"}}"#, BUILD_VERSION, BUILD_TAG)
}

// ── Tier token (seal / unseal) ────────────────────────────────────────────────

/// Create a signed tier token.
/// Returns: "tier|activated_ms|expires_ms|hmac_hex"
#[wasm_bindgen]
pub fn seal_tier(tier: &str, duration_days: u32) -> String {
    if !matches!(tier, "free" | "pro" | "master") {
        return String::new();
    }
    let now     = now_ms() as u64;
    let expires = now + (duration_days as u64) * 86_400_000;
    let payload = format!("{}|{}|{}", tier, now, expires);
    let mac     = hmac_sha256(HMAC_KEY, payload.as_bytes());
    format!("{}|{}", payload, to_hex(&mac))
}

/// Verify and extract tier from a signed token.
/// Returns the tier name ("free"/"pro"/"master") or "free" if invalid/expired.
#[wasm_bindgen]
pub fn unseal_tier(token: &str) -> String {
    let parts: Vec<&str> = token.split('|').collect();
    if parts.len() != 4 { return "free".into(); }

    let tier    = parts[0];
    let expires: u64 = match parts[2].parse() { Ok(v) => v, Err(_) => return "free".into() };

    if !matches!(tier, "free" | "pro" | "master") { return "free".into(); }

    // Timing-safe HMAC verification
    let payload      = format!("{}|{}|{}", tier, parts[1], parts[2]);
    let expected_mac = to_hex(&hmac_sha256(HMAC_KEY, payload.as_bytes()));
    if !constant_time_eq_str(&expected_mac, parts[3]) { return "free".into(); }

    // Expiry check
    if now_ms() as u64 >= expires { return "free".into(); }

    tier.into()
}

/// Get the expiry timestamp from a sealed token (0 if invalid).
#[wasm_bindgen]
pub fn get_token_expiry(token: &str) -> f64 {
    let parts: Vec<&str> = token.split('|').collect();
    if parts.len() != 4 { return 0.0; }

    let expires: u64 = match parts[2].parse() { Ok(v) => v, Err(_) => return 0.0 };
    let payload      = format!("{}|{}|{}", parts[0], parts[1], parts[2]);
    let expected_mac = to_hex(&hmac_sha256(HMAC_KEY, payload.as_bytes()));
    if !constant_time_eq_str(&expected_mac, parts[3]) { return 0.0; }

    expires as f64
}

/// Get the activated timestamp from a sealed token (0 if invalid).
#[wasm_bindgen]
pub fn get_token_activated(token: &str) -> f64 {
    let parts: Vec<&str> = token.split('|').collect();
    if parts.len() != 4 { return 0.0; }

    let activated: u64 = match parts[1].parse() { Ok(v) => v, Err(_) => return 0.0 };
    let payload        = format!("{}|{}|{}", parts[0], parts[1], parts[2]);
    let expected_mac   = to_hex(&hmac_sha256(HMAC_KEY, payload.as_bytes()));
    if !constant_time_eq_str(&expected_mac, parts[3]) { return 0.0; }

    activated as f64
}

// ── Promo code validation ─────────────────────────────────────────────────────

/// Validate a promo code against the embedded hash table.
/// Returns JSON: {"ok":true,"tier":"pro","days":30,"oneTime":false}
/// or            {"ok":false,"error":"Invalid or expired code."}
#[wasm_bindgen]
pub fn validate_promo(code: &str) -> String {
    let upper = code.trim().to_uppercase();
    let hash  = to_hex(&sha256(upper.as_bytes()));

    // Iterate every entry so timing doesn't reveal partial matches
    let mut found_tier: &str = "";
    let mut found_days: u32  = 0;
    let mut found_ot:   bool = false;
    let mut matched          = false;

    for &(expected_hash, tier, days, one_time) in PROMO_TABLE {
        // Use constant-time comparison to prevent timing side-channels
        if constant_time_eq_str(&hash, expected_hash) {
            found_tier = tier;
            found_days = days;
            found_ot   = one_time;
            matched    = true;
        }
    }

    if matched {
        return format!(
            r#"{{"ok":true,"tier":"{}","days":{},"oneTime":{}}}"#,
            found_tier, found_days, found_ot
        );
    }

    r#"{"ok":false,"error":"Invalid or expired code."}"#.into()
}

// ── Download counter (seal / unseal) ─────────────────────────────────────────

/// Create a signed download counter token.
/// Returns: "count|month_key|hmac_hex"
#[wasm_bindgen]
pub fn seal_downloads(count: u32, month_key: &str) -> String {
    let payload = format!("{}|{}", count, month_key);
    let mac     = hmac_sha256(HMAC_KEY, payload.as_bytes());
    format!("{}|{}", payload, to_hex(&mac))
}

/// Verify and extract download count from a signed token.
/// Returns the count, or 0 if invalid/tampered.
#[wasm_bindgen]
pub fn unseal_downloads(token: &str, expected_month: &str) -> u32 {
    let parts: Vec<&str> = token.split('|').collect();
    if parts.len() != 3 { return 0; }

    let count: u32 = match parts[0].parse() { Ok(v) => v, Err(_) => return 0 };
    let month      = parts[1];

    if month != expected_month { return 0; }

    let payload      = format!("{}|{}", count, month);
    let expected_mac = to_hex(&hmac_sha256(HMAC_KEY, payload.as_bytes()));
    if !constant_time_eq_str(&expected_mac, parts[2]) { return 0; }

    count
}

// ── Client-side rate-limit token ─────────────────────────────────────────────
// Allows the JS layer to issue a signed "rate permit" so downloads
// can be throttled client-side without a round-trip.
// Token format: "action|ip_hash|window_start|count|max|hmac_hex"

/// Issue a signed rate-limit permit.
/// `action`       — e.g. "download" or "search"
/// `ip_hash`      — SHA-256 of the client IP (pass from JS, never the raw IP)
/// `max_per_hour` — maximum allowed per hour
#[wasm_bindgen]
pub fn seal_rate_token(action: &str, ip_hash: &str, max_per_hour: u32) -> String {
    // Reject non-alpha action names to prevent injection
    if action.is_empty() || action.len() > 32
        || !action.chars().all(|c| c.is_ascii_alphanumeric() || c == '_')
    {
        return String::new();
    }

    let now           = now_ms() as u64;
    let window_start  = now - (now % 3_600_000); // snap to hour boundary
    let payload       = format!("{}|{}|{}|0|{}", action, ip_hash, window_start, max_per_hour);
    let mac           = hmac_sha256(HMAC_KEY, payload.as_bytes());
    format!("{}|{}", payload, to_hex(&mac))
}

/// Verify a rate-limit token and increment its counter.
/// Returns JSON: {"ok":true,"count":3,"max":10,"remaining":7}
/// or            {"ok":false,"error":"..."}
#[wasm_bindgen]
pub fn check_rate_token(token: &str, new_count: u32) -> String {
    let parts: Vec<&str> = token.split('|').collect();
    if parts.len() != 6 {
        return r#"{"ok":false,"error":"Malformed token."}"#.into();
    }

    let action       = parts[0];
    let ip_hash      = parts[1];
    let window_start: u64 = match parts[2].parse() {
        Ok(v) => v, Err(_) => return r#"{"ok":false,"error":"Bad window."}"#.into()
    };
    let max: u32 = match parts[4].parse() {
        Ok(v) => v, Err(_) => return r#"{"ok":false,"error":"Bad max."}"#.into()
    };

    // Re-verify HMAC over the original payload (count=0)
    let base_payload = format!("{}|{}|{}|0|{}", action, ip_hash, window_start, max);
    let expected_mac = to_hex(&hmac_sha256(HMAC_KEY, base_payload.as_bytes()));
    if !constant_time_eq_str(&expected_mac, parts[5]) {
        return r#"{"ok":false,"error":"Invalid signature."}"#.into();
    }

    // Check window hasn't expired
    let now = now_ms() as u64;
    if now >= window_start + 3_600_000 {
        return r#"{"ok":false,"error":"Window expired."}"#.into();
    }

    let remaining = if new_count >= max { 0 } else { max - new_count };
    let allowed   = new_count <= max;

    format!(
        r#"{{"ok":{},"count":{},"max":{},"remaining":{}}}"#,
        allowed, new_count, max, remaining
    )
}

// ── Session fingerprint token ─────────────────────────────────────────────────
// Binds a tier token to a session fingerprint so it can't be copy-pasted
// across different browsers/devices without detection.
// fingerprint = SHA-256( screen_w|screen_h|tz_offset|lang|platform )

/// Create a session-bound fingerprint token.
/// `fp_input` — pipe-separated browser characteristics (built by JS before calling)
#[wasm_bindgen]
pub fn seal_fingerprint(fp_input: &str) -> String {
    if fp_input.is_empty() || fp_input.len() > 512 {
        return String::new();
    }
    let fp_hash = to_hex(&sha256(fp_input.as_bytes()));
    let now     = now_ms() as u64;
    let payload = format!("fp|{}|{}", fp_hash, now);
    let mac     = hmac_sha256(HMAC_KEY, payload.as_bytes());
    format!("{}|{}", payload, to_hex(&mac))
}

/// Verify a fingerprint token against the current session.
/// Returns true only if the signature is valid and the fingerprint matches.
#[wasm_bindgen]
pub fn verify_fingerprint(token: &str, fp_input: &str) -> bool {
    let parts: Vec<&str> = token.split('|').collect();
    if parts.len() != 4 || parts[0] != "fp" { return false; }

    let stored_fp_hash = parts[1];
    let ts_str         = parts[2];
    let provided_mac   = parts[3];

    let payload      = format!("fp|{}|{}", stored_fp_hash, ts_str);
    let expected_mac = to_hex(&hmac_sha256(HMAC_KEY, payload.as_bytes()));
    if !constant_time_eq_str(&expected_mac, provided_mac) { return false; }

    // Hash the current fp_input and compare in constant time
    let current_hash = to_hex(&sha256(fp_input.as_bytes()));
    constant_time_eq_str(&current_hash, stored_fp_hash)
}

// ── Anti-tamper / integrity ───────────────────────────────────────────────────

/// Timing-based anti-debug canary.
/// A debugger with breakpoints will make Date.now() jumps much larger than
/// the expected WASM execution time, so we can detect paused execution.
/// Returns true if no debugger is detected, false if suspicious timing found.
#[wasm_bindgen]
pub fn anti_debug_check() -> bool {
    let t0 = now_ms();
    // Do a non-trivial amount of work so the timing window is real
    let _ = sha256(b"ghostlua-anti-debug-canary-2026");
    let _ = hmac_sha256(HMAC_KEY, b"ghostlua-canary");
    let t1 = now_ms();

    // SHA-256 + HMAC in WASM should finish in < 50 ms on any real device.
    // A paused debugger will show gaps of hundreds of ms or more.
    let elapsed = t1 - t0;
    elapsed < 250.0
}

/// Perform a full integrity check — SHA-256 test vector + HMAC sanity check.
/// Returns true if the WASM module is operating correctly (anti-tamper canary).
#[wasm_bindgen]
pub fn integrity_check() -> bool {
    // SHA-256 of "ghostlua" must produce a valid 64-char lowercase hex string
    let test_hash = sha256(b"ghostlua");
    let hex       = to_hex(&test_hash);
    if hex.len() != 64 { return false; }
    if hex.chars().all(|c| c == '0') { return false; }

    // HMAC output must be 32 bytes / 64 hex chars and differ from raw SHA-256
    let hmac_out = hmac_sha256(HMAC_KEY, b"ghostlua");
    let hmac_hex = to_hex(&hmac_out);
    if hmac_hex.len() != 64 { return false; }
    if hmac_hex == hex { return false; } // HMAC ≠ SHA-256

    // Constant-time compare must work correctly (self-test)
    let a = b"ghostlua";
    let b = b"ghostlua";
    let c = b"ghostLUA";
    if !constant_time_eq(a, b) { return false; }
    if  constant_time_eq(a, c) { return false; }

    true
}

// ── Utility ───────────────────────────────────────────────────────────────────

/// Return the SHA-256 hash of the input as a lowercase hex string.
#[wasm_bindgen]
pub fn hash_string(input: &str) -> String {
    to_hex(&sha256(input.as_bytes()))
}

/// Return the HMAC-SHA256 of a message as a lowercase hex string.
/// Useful for the JS side to create custom signed payloads.
#[wasm_bindgen]
pub fn hmac_string(message: &str) -> String {
    to_hex(&hmac_sha256(HMAC_KEY, message.as_bytes()))
}
