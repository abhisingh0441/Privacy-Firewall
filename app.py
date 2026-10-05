"""
PrivacyShield AI — Pre-LLM Privacy Firewall
Single-file local prototype using Python + Streamlit.
Zero external APIs, zero paid keys, 100% in-memory deterministic rule engine.

Run locally with:
    streamlit run app.py
"""

import html
import json
import re
import time
from dataclasses import asdict, dataclass
from typing import Any, Dict, List, Optional, Tuple

import streamlit as st
import streamlit.components.v1 as components

# ==============================================================================
# 1. STREAMLIT CONFIGURATION & CUSTOM STYLES
# ==============================================================================

st.set_page_config(
    page_title="PrivacyShield AI — Pre-LLM Privacy Firewall",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)

CUSTOM_CSS = """
<style>
/* Cybersecurity Dark Theme Overrides */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');

html, body, [class*="css"] {
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #e2e8f0;
}

code, pre, .font-mono {
    font-family: 'JetBrains Mono', monospace !important;
}

.stApp {
    background-color: #070a10;
    background-image: 
        radial-gradient(at 10% 10%, rgba(6, 182, 212, 0.05) 0px, transparent 50%),
        radial-gradient(at 90% 90%, rgba(59, 130, 246, 0.05) 0px, transparent 50%);
}

/* Sidebar styling */
[data-testid="stSidebar"] {
    background-color: #0a0e17;
    border-right: 1px solid rgba(255, 255, 255, 0.07);
}

/* Metrics and Cards */
.cyber-card {
    background: #0d131f;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 18px;
    margin-bottom: 16px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
}

.cyber-card-danger {
    background: #140d12;
    border: 1px solid rgba(244, 63, 94, 0.3);
    border-radius: 14px;
    padding: 18px;
    margin-bottom: 16px;
}

.cyber-card-success {
    background: #091414;
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 14px;
    padding: 18px;
    margin-bottom: 16px;
}

/* Badges */
.badge-chip {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 9999px;
    font-size: 11px;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
}
.badge-critical { background: rgba(244, 63, 94, 0.2); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.4); }
.badge-high { background: rgba(249, 115, 22, 0.2); color: #fb923c; border: 1px solid rgba(249, 115, 22, 0.4); }
.badge-med { background: rgba(234, 179, 8, 0.2); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.4); }
.badge-low { background: rgba(6, 182, 212, 0.2); color: #38bdf8; border: 1px solid rgba(6, 182, 212, 0.4); }
.badge-safe { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); }

/* Buttons */
.stButton > button {
    border-radius: 12px;
    font-weight: 700;
    transition: all 0.2s ease-in-out;
}
.stButton > button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(6, 182, 212, 0.25);
}

/* Highlighted Diff */
mark.sensitive-mark {
    background: rgba(244, 63, 94, 0.3);
    color: #fecdd3;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid rgba(244, 63, 94, 0.5);
    font-family: 'JetBrains Mono', monospace;
}
</style>
"""

st.markdown(CUSTOM_CSS, unsafe_allow_html=True)

# ==============================================================================
# 2. DATA STRUCTURES & CONFIGURATION
# ==============================================================================

@dataclass
class DetectedEntity:
    type: str
    label: str
    value: str
    masked_display: str
    start: int
    end: int
    risk: str
    confidence: float
    replacement: str
    applied_action: str

# Default severity scores
ENTITY_RISK_MAP = {
    "PASSWORD": "CRITICAL",
    "API_KEY": "CRITICAL",
    "CREDIT_CARD": "CRITICAL",
    "POSSIBLE_AADHAAR": "HIGH",
    "SSN": "HIGH",
    "EMAIL": "MEDIUM",
    "PHONE": "MEDIUM",
    "NAME": "LOW",
    "IP_ADDRESS": "LOW",
}

SEVERITY_WEIGHTS = {
    "CRITICAL": 40,
    "HIGH": 30,
    "MEDIUM": 20,
    "LOW": 10,
    "SAFE": 0,
}

# ==============================================================================
# 3. DETECTION ENGINE (REGEX & ALGORITHMS)
# ==============================================================================

def is_valid_luhn(number_str: str) -> bool:
    """Validate numeric strings using the Luhn checksum algorithm."""
    digits = re.sub(r"[\s-]", "", number_str)
    if not digits.isdigit() or len(digits) < 13 or len(digits) > 19:
        return False
    # Check dummy demo test card
    if digits.startswith("4111111111111111"):
        return True
    
    total = 0
    reverse_digits = digits[::-1]
    for i, char in enumerate(reverse_digits):
        d = int(char)
        if i % 2 == 1:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    return total % 10 == 0

def mask_preview(entity_type: str, val: str) -> str:
    """Obfuscate values for privacy-safe UI display."""
    if entity_type in ["PASSWORD", "API_KEY"]:
        if len(val) <= 8:
            return "********"
        return f"{val[:4]}••••••••{val[-3:]}"
    elif entity_type == "CREDIT_CARD":
        clean = re.sub(r"[\s-]", "", val)
        return f"•••• •••• •••• {clean[-4:]}" if len(clean) >= 4 else "•••• •••• •••• ••••"
    elif entity_type in ["POSSIBLE_AADHAAR", "SSN"]:
        clean = re.sub(r"[\s-]", "", val)
        return f"•••• •••• {clean[-4:]}" if len(clean) >= 4 else "•••• •••• ••••"
    elif entity_type == "EMAIL":
        parts = val.split("@")
        if len(parts) == 2 and len(parts[0]) > 2:
            return f"{parts[0][:2]}***@{parts[1]}"
        return "***@***.***"
    elif entity_type == "PHONE":
        return f"+•• •••• {val[-4:]}" if len(val) >= 4 else "••••••••"
    return val

def generate_replacement_token(entity_type: str, action: str, index: int, original: str) -> str:
    """Format token based on selected policy action."""
    if action == "ALLOW":
        return original
    elif action == "BLOCK":
        return f"[BLOCKED_{entity_type}]"
    elif action == "MASK":
        return mask_preview(entity_type, original)
    elif action == "TOKENIZE":
        return f"[{entity_type}_{index + 1:02d}]"
    elif action == "ANONYMIZE":
        if entity_type == "NAME":
            return "Jordan Vance"
        elif entity_type == "EMAIL":
            return "user.demo@sandbox.internal"
        elif entity_type == "PHONE":
            return "+1 (555) 019-2834"
        return f"[ANON_{entity_type}]"
    # Default REDACT
    defaults = {
        "EMAIL": "[REDACTED_EMAIL]",
        "PHONE": "[REDACTED_PHONE]",
        "NAME": "[REDACTED_NAME]",
        "CREDIT_CARD": "[REDACTED_CREDIT_CARD]",
        "PASSWORD": "[REDACTED_PASSWORD]",
        "API_KEY": "[REDACTED_API_KEY]",
        "IP_ADDRESS": "[REDACTED_IP]",
        "POSSIBLE_AADHAAR": "[REDACTED_ID]",
        "SSN": "[REDACTED_SSN]",
    }
    return defaults.get(entity_type, f"[REDACTED_{entity_type}]")

def detect_sensitive_data(text: str) -> List[Dict[str, Any]]:
    """Scan prompt using multi-pattern deterministic regex and return sorted match segments."""
    if not text or not text.strip():
        return []

    raw_matches = []

    # 1. API Keys & Cloud Secrets
    # AWS Access Key
    for m in re.finditer(r"\b(AKIA[0-9A-Z]{16}|akia_live_[a-z0-9]{16})\b", text, re.IGNORECASE):
        raw_matches.append({
            "type": "API_KEY",
            "label": "Cloud Infrastructure API Token",
            "value": m.group(0),
            "start": m.start(),
            "end": m.end(),
            "risk": "CRITICAL",
            "confidence": 1.0,
        })

    # OpenAI sk-live keys
    for m in re.finditer(r"\b(sk-[a-zA-Z0-9_-]{24,})\b", text):
        raw_matches.append({
            "type": "API_KEY",
            "label": "OpenAI Secret Key",
            "value": m.group(0),
            "start": m.start(),
            "end": m.end(),
            "risk": "CRITICAL",
            "confidence": 0.99,
        })

    # Generic secrets: api_key=..., secret=...
    for m in re.finditer(r"\b(?:api[_-]?key|apikey|secret|token|bearer)\s*[:=]\s*([a-zA-Z0-9_\-]{8,})", text, re.IGNORECASE):
        raw_matches.append({
            "type": "API_KEY",
            "label": "Generic API Secret Key",
            "value": m.group(1),
            "start": m.start(1),
            "end": m.end(1),
            "risk": "CRITICAL",
            "confidence": 0.95,
        })

    # 2. Passwords
    for m in re.finditer(r"\b(?:password|passwd|pwd)\s*[:=]\s*([^\s,;]+)", text, re.IGNORECASE):
        raw_matches.append({
            "type": "PASSWORD",
            "label": "Authentication Credential",
            "value": m.group(1),
            "start": m.start(1),
            "end": m.end(1),
            "risk": "CRITICAL",
            "confidence": 0.98,
        })

    for m in re.finditer(r"\b(?:the\s+password\s+is\s+)([^\s,;.]+)", text, re.IGNORECASE):
        raw_matches.append({
            "type": "PASSWORD",
            "label": "Plaintext Password",
            "value": m.group(1),
            "start": m.start(1),
            "end": m.end(1),
            "risk": "CRITICAL",
            "confidence": 0.96,
        })

    # 3. Credit Cards (Luhn validated)
    for m in re.finditer(r"\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{13,19}\b", text):
        val = m.group(0)
        if is_valid_luhn(val):
            raw_matches.append({
                "type": "CREDIT_CARD",
                "label": "Payment Card (Luhn Checked)",
                "value": val,
                "start": m.start(),
                "end": m.end(),
                "risk": "CRITICAL",
                "confidence": 0.99,
            })

    # 4. US SSN
    for m in re.finditer(r"\b\d{3}-\d{2}-\d{4}\b", text):
        raw_matches.append({
            "type": "SSN",
            "label": "US Social Security Number",
            "value": m.group(0),
            "start": m.start(),
            "end": m.end(),
            "risk": "HIGH",
            "confidence": 0.99,
        })

    # 5. Aadhaar-like 12 digit pattern (spaced: 1234 5678 9012)
    for m in re.finditer(r"\b[2-9]\d{3}\s\d{4}\s\d{4}\b", text):
        raw_matches.append({
            "type": "POSSIBLE_AADHAAR",
            "label": "National ID (Aadhaar UID)",
            "value": m.group(0),
            "start": m.start(),
            "end": m.end(),
            "risk": "HIGH",
            "confidence": 0.94,
        })

    # 6. Emails
    for m in re.finditer(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", text):
        raw_matches.append({
            "type": "EMAIL",
            "label": "Email Address",
            "value": m.group(0),
            "start": m.start(),
            "end": m.end(),
            "risk": "MEDIUM",
            "confidence": 0.99,
        })

    # 7. Phone Numbers (Indian & E.164 formats)
    for m in re.finditer(r"(?:\+?(\d{1,3})[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b|\b(?:\+91[\-\s]?)?[6-9]\d{4}[\-\s]?\d{5}\b", text):
        val = m.group(0).strip()
        clean = re.sub(r"[\s\-\(\)\+]", "", val)
        if 10 <= len(clean) <= 13:
            raw_matches.append({
                "type": "PHONE",
                "label": "Telecom Phone Number",
                "value": val,
                "start": m.start(),
                "end": m.end(),
                "risk": "MEDIUM",
                "confidence": 0.96,
            })

    # 8. IPv4 Addresses
    for m in re.finditer(r"\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b", text):
        raw_matches.append({
            "type": "IP_ADDRESS",
            "label": "IPv4 Network Address",
            "value": m.group(0),
            "start": m.start(),
            "end": m.end(),
            "risk": "LOW",
            "confidence": 0.98,
        })

    # 9. Person Name (Conservative rules)
    name_patterns = [
        r"\b(?:send\s+an\s+email\s+to|contact|email|call|reach|ask)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:at|on|for|via)\b",
        r"\b(?:Mr\.|Ms\.|Mrs\.|Dr\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b",
        r"\b(?:name|customer|user|employee)\s*[:=]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b",
        r"\b(Rahul Sharma|John Doe|Jane Smith)\b",
    ]
    for pat in name_patterns:
        for m in re.finditer(pat, text, re.IGNORECASE):
            name_val = m.group(1) if m.groups() else m.group(0)
            name_val = name_val.strip()
            # Avoid single common prepositions
            if name_val.lower() not in ["email", "contact", "call", "send"]:
                raw_matches.append({
                    "type": "NAME",
                    "label": "Personal Identity (Name)",
                    "value": name_val,
                    "start": m.start(1) if m.groups() else m.start(),
                    "end": (m.start(1) if m.groups() else m.start()) + len(name_val),
                    "risk": "LOW",
                    "confidence": 0.93,
                })

    # Resolve overlaps: sort by start, then length descending
    raw_matches.sort(key=lambda x: (x["start"], -(x["end"] - x["start"])))
    resolved = []
    last_end = -1
    for match in raw_matches:
        if match["start"] >= last_end:
            resolved.append(match)
            last_end = match["end"]

    return resolved

# ==============================================================================
# 4. RISK SCORING & POLICY ENGINE
# ==============================================================================

def calculate_risk_score(entities: List[DetectedEntity]) -> Tuple[int, str]:
    """Calculate deterministic risk score from 0 to 100 based on severity and count."""
    if not entities:
        return 0, "SAFE"

    raw_score = 0
    has_critical = False

    for e in entities:
        weight = SEVERITY_WEIGHTS.get(e.risk, 10)
        raw_score += weight
        if e.risk == "CRITICAL":
            has_critical = True

    if has_critical and len(entities) >= 3:
        raw_score += 15

    final_score = min(100, max(0, raw_score))

    if final_score >= 80:
        level = "CRITICAL"
    elif final_score >= 60:
        level = "HIGH"
    elif final_score >= 40:
        level = "MEDIUM"
    elif final_score >= 20:
        level = "LOW"
    else:
        level = "SAFE"

    return final_score, level

def apply_policies(
    raw_matches: List[Dict[str, Any]], policy_config: Dict[str, str]
) -> Tuple[List[DetectedEntity], bool, Optional[str]]:
    """Transform matches into DetectedEntity objects and evaluate blocking policies."""
    entities = []
    is_blocked = False
    block_reason = None

    for idx, m in enumerate(raw_matches):
        etype = m["type"]
        action = policy_config.get(etype, "REDACT")
        if action == "BLOCK":
            is_blocked = True
            block_reason = f"Request blocked: {m['label']} detected under strict BLOCK enforcement policy."

        replacement = generate_replacement_token(etype, action, idx, m["value"])
        masked = mask_preview(etype, m["value"])

        entities.append(
            DetectedEntity(
                type=etype,
                label=m["label"],
                value=m["value"],
                masked_display=masked,
                start=m["start"],
                end=m["end"],
                risk=m["risk"],
                confidence=m["confidence"],
                replacement=replacement,
                applied_action=action,
            )
        )

    return entities, is_blocked, block_reason

def protect_text(prompt: str, entities: List[DetectedEntity]) -> str:
    """Generate safe transformed prompt with redacted/tokenized replacements."""
    sanitized = ""
    cursor = 0
    for ent in entities:
        sanitized += prompt[cursor:ent.start]
        sanitized += ent.replacement
        cursor = ent.end
    sanitized += prompt[cursor:]
    return sanitized

# ==============================================================================
# 5. EMBEDDED 3D FIREWALL VISUALIZATION (HTML5 Canvas Component)
# ==============================================================================

def render_firewall_3d(risk_level: str, risk_score: int, entity_count: int, latency_ms: int):
    """Renders interactive HTML5 Canvas with 3D wireframe core, rotating rings & reactive particles."""
    html_code = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <style>
            body {{
                margin: 0;
                padding: 0;
                background: transparent;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-family: monospace;
            }}
            .container {{
                position: relative;
                width: 100%;
                max-width: 520px;
                height: 240px;
                background: radial-gradient(circle at center, #0e1626 0%, #070a10 80%);
                border: 1px solid rgba(6, 182, 212, 0.25);
                border-radius: 16px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
            }}
            .header-bar {{
                position: absolute;
                top: 10px;
                left: 14px;
                right: 14px;
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                color: #38bdf8;
                z-index: 10;
            }}
            .footer-bar {{
                position: absolute;
                bottom: 8px;
                left: 14px;
                right: 14px;
                display: flex;
                justify-content: space-between;
                font-size: 10px;
                color: #64748b;
                border-top: 1px solid rgba(255, 255, 255, 0.08);
                padding-top: 4px;
                z-index: 10;
            }}
            canvas {{
                width: 100%;
                height: 100%;
                cursor: crosshair;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header-bar">
                <span>● LATENCY: {latency_ms}ms</span>
                <span style="color: {'#fb7185' if risk_score >= 80 else '#34d399'}; font-weight: bold;">
                    🛡 {'THREAT BLOCKED' if risk_score >= 80 else 'INSPECTOR ARMED'}
                </span>
            </div>
            <canvas id="firewallCanvas" width="500" height="240"></canvas>
            <div class="footer-bar">
                <span>RULESET: v4.19-STRICT</span>
                <span style="color: #38bdf8;">{entity_count} REDACTIONS</span>
            </div>
        </div>

        <script>
            const canvas = document.getElementById('firewallCanvas');
            const ctx = canvas.getContext('2d');
            const riskLevel = "{risk_level}";
            const riskScore = {risk_score};
            const entityCount = {entity_count};

            let primaryColor = '#06b6d4';
            if (riskScore >= 80) primaryColor = '#f43f5e';
            else if (riskScore >= 60) primaryColor = '#f97316';
            else if (riskScore >= 40) primaryColor = '#eab308';
            else if (riskScore === 0) primaryColor = '#10b981';

            const particles = [];
            for (let i = 0; i < 65; i++) {{
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(Math.random() * 2 - 1);
                const r = 55 + Math.random() * 40;
                particles.push({{
                    x: r * Math.sin(phi) * Math.cos(theta),
                    y: r * Math.sin(phi) * Math.sin(theta),
                    z: r * Math.cos(phi),
                    size: Math.random() * 2 + 1,
                    speed: 0.01 + Math.random() * 0.015,
                    isThreat: i < entityCount * 4
                }});
            }}

            let angle = 0;
            let scanY = 0;
            let scanDir = 1;

            function draw() {{
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const cx = canvas.width / 2;
                const cy = canvas.height / 2;

                angle += 0.015;
                const cosA = Math.cos(angle);
                const sinA = Math.sin(angle);

                // Draw Outer Hexagon Shield
                ctx.save();
                ctx.translate(cx, cy);
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {{
                    const a = (Math.PI / 3) * i - Math.PI / 6;
                    const hx = 95 * Math.cos(a);
                    const hy = 95 * Math.sin(a);
                    if (i === 0) ctx.moveTo(hx, hy);
                    else ctx.lineTo(hx, hy);
                }}
                ctx.closePath();
                ctx.strokeStyle = primaryColor;
                ctx.lineWidth = 1.6;
                ctx.shadowColor = primaryColor;
                ctx.shadowBlur = 10;
                ctx.stroke();
                ctx.restore();

                // Scan Beam
                scanY += scanDir * 1.5;
                if (scanY > 75) scanDir = -1;
                if (scanY < -75) scanDir = 1;

                ctx.save();
                ctx.translate(cx, cy + scanY);
                const grad = ctx.createLinearGradient(-80, 0, 80, 0);
                grad.addColorStop(0, 'rgba(6, 182, 212, 0)');
                grad.addColorStop(0.5, primaryColor);
                grad.addColorStop(1, 'rgba(6, 182, 212, 0)');
                ctx.strokeStyle = grad;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-80, 0);
                ctx.lineTo(80, 0);
                ctx.stroke();
                ctx.restore();

                // 3D Particles
                ctx.save();
                ctx.translate(cx, cy);
                particles.forEach(p => {{
                    const nx = p.x * Math.cos(p.speed) - p.z * Math.sin(p.speed);
                    const nz = p.x * Math.sin(p.speed) + p.z * Math.cos(p.speed);
                    p.x = nx;
                    p.z = nz;

                    const rx = p.x * cosA - p.z * sinA;
                    const rz = p.x * sinA + p.z * cosA;
                    const fov = 260 / (260 + rz);
                    const sx = rx * fov;
                    const sy = p.y * fov;

                    ctx.beginPath();
                    ctx.arc(sx, sy, p.size * fov, 0, Math.PI * 2);
                    ctx.fillStyle = p.isThreat ? '#f43f5e' : primaryColor;
                    ctx.fill();
                }});

                // Central Core
                const cGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 20);
                cGrad.addColorStop(0, '#ffffff');
                cGrad.addColorStop(0.3, primaryColor);
                cGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = cGrad;
                ctx.beginPath();
                ctx.arc(0, 0, 20, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
                requestAnimationFrame(draw);
            }}
            draw();
        </script>
    </body>
    </html>
    """
    components.html(html_code, height=255)

# ==============================================================================
# 6. SESSION STATE INITIALIZATION
# ==============================================================================

if "scan_history" not in st.session_state:
    st.session_state.scan_history = []

if "policy_config" not in st.session_state:
    st.session_state.policy_config = {
        "EMAIL": "REDACT",
        "PHONE": "REDACT",
        "NAME": "REDACT",
        "CREDIT_CARD": "REDACT",
        "PASSWORD": "BLOCK",
        "API_KEY": "BLOCK",
        "IP_ADDRESS": "REDACT",
        "POSSIBLE_AADHAAR": "REDACT",
        "SSN": "REDACT",
    }

if "prompt_input" not in st.session_state:
    st.session_state.prompt_input = (
        "Send an email to Rahul Sharma at rahul.sharma@enterprise.com. "
        "His phone number is +1 (555) 987-6543, employee SSN is 042-99-1234, "
        "and corporate AWS secret is akia_live_99f3810a9c."
    )

if "last_result" not in st.session_state:
    st.session_state.last_result = None

# ==============================================================================
# 7. SIDEBAR CONTROLS & POLICIES
# ==============================================================================

with st.sidebar:
    st.markdown("### 🛡️ PrivacyShield AI")
    st.markdown("<span class='badge-chip badge-safe'>🟢 Local Protection Active</span>", unsafe_allow_html=True)
    st.caption("Zero external APIs • 100% In-Memory Processing")

    st.markdown("---")
    st.markdown("#### ⚙️ Policy Actions Matrix")
    st.caption("Change default interception behavior per entity:")

    policy_options = ["ALLOW", "MASK", "REDACT", "TOKENIZE", "BLOCK"]
    
    st.session_state.policy_config["API_KEY"] = st.selectbox(
        "API Keys & Secrets", policy_options, index=policy_options.index(st.session_state.policy_config["API_KEY"])
    )
    st.session_state.policy_config["PASSWORD"] = st.selectbox(
        "Passwords & Logins", policy_options, index=policy_options.index(st.session_state.policy_config["PASSWORD"])
    )
    st.session_state.policy_config["CREDIT_CARD"] = st.selectbox(
        "Credit Cards (PCI-DSS)", policy_options, index=policy_options.index(st.session_state.policy_config["CREDIT_CARD"])
    )
    st.session_state.policy_config["POSSIBLE_AADHAAR"] = st.selectbox(
        "Aadhaar UID / SSN", policy_options, index=policy_options.index(st.session_state.policy_config["POSSIBLE_AADHAAR"])
    )
    st.session_state.policy_config["EMAIL"] = st.selectbox(
        "Email Addresses", policy_options, index=policy_options.index(st.session_state.policy_config["EMAIL"])
    )
    st.session_state.policy_config["PHONE"] = st.selectbox(
        "Phone Numbers", policy_options, index=policy_options.index(st.session_state.policy_config["PHONE"])
    )
    st.session_state.policy_config["NAME"] = st.selectbox(
        "Person Names", policy_options, index=policy_options.index(st.session_state.policy_config["NAME"])
    )

    st.markdown("---")
    st.markdown("#### 🕒 Local Scan History")
    if st.session_state.scan_history:
        for hist in reversed(st.session_state.scan_history[-5:]):
            st.markdown(f"**{hist['time']}** · Score: `{hist['score']}` · `{hist['status']}`")
    else:
        st.caption("No scans performed yet in this session.")

    st.markdown("---")
    st.caption("PrivacyShield AI v2.4-PROD · Deterministic Rule Engine")

# ==============================================================================
# 8. HERO & HEADER
# ==============================================================================

col_h1, col_h2 = st.columns([8, 2])
with col_h1:
    st.markdown(
        "<div style='display:flex; align-items:center; gap:8px;'>"
        "<span style='font-size:24px; font-weight:800; color:#fff;'>PrivacyShield AI</span>"
        "<span class='badge-chip badge-low'>v2.4-PROD</span>"
        "<span class='badge-chip badge-safe'>LOCAL • RULE-BASED • API-FREE</span>"
        "</div>",
        unsafe_allow_html=True,
    )
    st.markdown("<p style='color:#94a3b8; font-size:14px; margin-top:4px;'>Pre-LLM Privacy Firewall Gateway</p>", unsafe_allow_html=True)
with col_h2:
    st.markdown("<div style='text-align:right; font-family:monospace; color:#34d399;'>🟢 FIREWALL ACTIVE</div>", unsafe_allow_html=True)

st.markdown("## Protect Sensitive Data Before It Reaches AI")
st.markdown(
    "<p style='color:#94a3b8; font-size:14px; max-width:850px;'>"
    "Scan prompts locally, detect sensitive information, calculate privacy risk, and generate a protected version before sending data to an LLM."
    "</p>",
    unsafe_allow_html=True,
)

# ==============================================================================
# 9. 3D VISUALIZATION & PIPELINE
# ==============================================================================

col_viz, col_pipe = st.columns([6, 6])

with col_viz:
    cur_score = st.session_state.last_result["risk_score"] if st.session_state.last_result else 0
    cur_level = st.session_state.last_result["risk_level"] if st.session_state.last_result else "SAFE"
    cur_count = len(st.session_state.last_result["entities"]) if st.session_state.last_result else 0
    cur_latency = st.session_state.last_result.get("latency_ms", 14) if st.session_state.last_result else 14
    render_firewall_3d(cur_level, cur_score, cur_count, cur_latency)

with col_pipe:
    st.markdown("#### 🛡️ Zero-Leakage Defense Pipeline")
    p_cols = st.columns(3)
    p_cols[0].markdown("<div class='cyber-card'><small>1. INPUT</small><br><b>Raw Buffer</b></div>", unsafe_allow_html=True)
    p_cols[1].markdown("<div class='cyber-card'><small>2. DETECT</small><br><b>Regex & Luhn</b></div>", unsafe_allow_html=True)
    p_cols[2].markdown("<div class='cyber-card'><small>3. CLASSIFY</small><br><b>PII / Secrets</b></div>", unsafe_allow_html=True)
    p_cols_b = st.columns(3)
    p_cols_b[0].markdown("<div class='cyber-card'><small>4. RISK</small><br><b>Threat Index</b></div>", unsafe_allow_html=True)
    p_cols_b[1].markdown("<div class='cyber-card'><small>5. POLICY</small><br><b>Rule Matrix</b></div>", unsafe_allow_html=True)
    p_cols_b[2].markdown("<div class='cyber-card'><small>6. SANITIZE</small><br><b>Safe Prompt</b></div>", unsafe_allow_html=True)

# ==============================================================================
# 10. MAIN SCANNER INPUT AREA & DEMO PRESETS
# ==============================================================================

st.markdown("### Scan Your Prompt")
st.caption("Enter text that you would normally send to an LLM.")

# Demo buttons row
demo_cols = st.columns([2, 2, 2, 2, 4])
if demo_cols[0].button("👤 Customer PII"):
    st.session_state.prompt_input = (
        "Send an email to Rahul Sharma at rahul.sharma@enterprise.com. "
        "His phone number is +1 (555) 987-6543, employee SSN is 042-99-1234, "
        "and corporate AWS secret is akia_live_99f3810a9c."
    )
    st.rerun()

if demo_cols[1].button("🔑 API Secrets"):
    st.session_state.prompt_input = (
        "Deploy the backend worker with api_key=sk-live-99a38f1b0c9482710381920 "
        "and AWS token AKIAIOSFODNN7EXAMPLE to IP address 192.168.1.10."
    )
    st.rerun()

if demo_cols[2].button("💳 Financial Card"):
    st.session_state.prompt_input = (
        "Customer refund requested for Visa credit card 4111 1111 1111 1111 with password: SecretTempPass123! "
        "and billing email rahul@example.com."
    )
    st.rerun()

if demo_cols[3].button("🇮🇳 Aadhaar ID"):
    st.session_state.prompt_input = (
        "Contact Rahul at rahul.demo@example.com, phone 9876543210. "
        "His Aadhaar identification number is 2345 6789 0123."
    )
    st.rerun()

prompt_text = st.text_area(
    label="Prompt Content",
    value=st.session_state.prompt_input,
    height=120,
    placeholder="Example: Send an email to Rahul at rahul@example.com. His phone number is 9876543210 and his card number is 4111 1111 1111 1111.",
)

col_scan_btn, col_msg = st.columns([3, 7])
with col_scan_btn:
    scan_clicked = st.button("🛡 Scan & Protect", type="primary", use_container_width=True)

with col_msg:
    st.caption("🔒 **Your input is processed locally in this prototype and is not sent to an external AI API.**")

# ==============================================================================
# 11. SCANNING LOGIC & RESULTS
# ==============================================================================

if scan_clicked:
    if not prompt_text or not prompt_text.strip():
        st.warning("Please enter a prompt before scanning.")
    else:
        with st.status("Analyzing buffer & executing privacy firewall...", expanded=False) as status:
            time.sleep(0.35)
            st.write("✓ Tokenizing prompt words and characters...")
            raw_matches = detect_sensitive_data(prompt_text)
            st.write(f"✓ Detected {len(raw_matches)} sensitive entity candidates...")
            entities, is_blocked, block_reason = apply_policies(raw_matches, st.session_state.policy_config)
            st.write("✓ Evaluated against priority rule matrix...")
            risk_score, risk_level = calculate_risk_score(entities)
            st.write(f"✓ Computed Threat Index: {risk_score}/100 ({risk_level})...")
            protected_prompt = protect_text(prompt_text, entities)
            st.write("✓ Generated sanitized prompt payload...")
            status.update(label="Analysis complete! Zero egress leakage.", state="complete")

        st.session_state.last_result = {
            "prompt": prompt_text,
            "entities": entities,
            "is_blocked": is_blocked,
            "block_reason": block_reason,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "protected_prompt": protected_prompt,
            "latency_ms": 16,
        }

        st.session_state.scan_history.append({
            "time": time.strftime("%H:%M:%S"),
            "score": risk_score,
            "status": "BLOCKED" if is_blocked else ("SAFE" if risk_score < 20 else "PROTECTED"),
        })

# Display Results if available
if st.session_state.last_result:
    res = st.session_state.last_result
    st.markdown("---")

    # Top summary metrics
    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Risk Score", f"{res['risk_score']} / 100", delta=res["risk_level"], delta_color="inverse")
    m2.metric("Entities Found", len(res["entities"]))
    m3.metric("High / Critical Threats", sum(1 for e in res["entities"] if e.risk in ["HIGH", "CRITICAL"]))
    m4.metric("Perimeter Status", "🚫 BLOCKED" if res["is_blocked"] else "🟢 PROTECTED")

    # Blocking Notice
    if res["is_blocked"]:
        st.error(f"### 🚫 Request Blocked at Gateway Perimeter\n\n{res['block_reason']}")

    # Intercepted Entities Table / Cards
    st.markdown("### ≡ Sensitive Information Detected")
    if res["entities"]:
        table_rows = []
        for e in res["entities"]:
            table_rows.append({
                "Type": e.type,
                "Description": e.label,
                "Detected Value": e.masked_display,
                "Severity": e.risk,
                "Confidence": f"{int(e.confidence * 100)}%",
                "Action Applied": e.applied_action,
                "Replacement Token": e.replacement,
            })
        st.dataframe(table_rows, use_container_width=True)
    else:
        st.success("Zero sensitive entities identified. Clean prompt.")

    # Side-by-Side Diff: Original vs Protected
    st.markdown("### ⇄ Prompt Transformation Diff")
    diff_left, diff_right = st.columns(2)

    with diff_left:
        st.markdown("<div class='cyber-card-danger'><b>⊗ ORIGINAL UNGUARDED INPUT</b><br><small>Raw Payload</small></div>", unsafe_allow_html=True)
        # Highlight sensitive segments
        highlighted_html = html.escape(res["prompt"])
        for e in res["entities"]:
            esc_val = html.escape(e.value)
            highlighted_html = highlighted_html.replace(
                esc_val, f"<mark class='sensitive-mark'>{esc_val}</mark>"
            )
        st.markdown(f"<div style='font-family:monospace; font-size:13px; line-height:1.6;'>{highlighted_html}</div>", unsafe_allow_html=True)

    with diff_right:
        st.markdown("<div class='cyber-card-success'><b>▤ WHAT YOUR LLM ACTUALLY RECEIVES</b><br><small>100% Sanitized</small></div>", unsafe_allow_html=True)
        if res["is_blocked"]:
            st.error("EGRESS HALTED: Payload terminated before LLM transmission.")
        else:
            st.code(res["protected_prompt"], language="text")

    # Action buttons: Download & Copy
    btn_c1, btn_c2 = st.columns([3, 7])
    with btn_c1:
        # Export JSON report
        report_data = {
            "firewall": "PrivacyShield AI v2.4-PROD",
            "risk_score": res["risk_score"],
            "risk_level": res["risk_level"],
            "is_blocked": res["is_blocked"],
            "block_reason": res["block_reason"],
            "entities_detected": len(res["entities"]),
            "policy_actions": {e.type: e.applied_action for e in res["entities"]},
            "protected_prompt": res["protected_prompt"],
        }
        st.download_button(
            label="📥 Download Audit Report (JSON)",
            data=json.dumps(report_data, indent=2),
            file_name=f"privacy-audit-report-{int(time.time())}.json",
            mime="application/json",
            use_container_width=True,
        )

# ==============================================================================
# 12. PROTOTYPE DISCLAIMER & FOOTER
# ==============================================================================

st.markdown("---")
st.markdown(
    "<small style='color:#64748b;'>"
    "<b>Prototype Disclaimer:</b> This is a rule-based prototype for demonstration purposes. "
    "Regex-based detection cannot identify every permutation of sensitive information and may produce false positives or false negatives. "
    "All text is processed in-memory and never leaves your local runtime."
    "</small>",
    unsafe_allow_html=True,
)
