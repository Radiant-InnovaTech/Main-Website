#!/usr/bin/env python3
"""Builds the static pages for the Radiant InnovaTech website from the reviewed copy in pages.py.
Usage: python3 build_site.py /path/to/Main-Website
Writes into <repo>/public-site/. Placeholders written as [[like this]] are rendered as visible
yellow marks and the site check (scripts/check-site.js) fails until every one is replaced."""
import html, re, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pages import HOME, WORKING, SECURITY, HOWITWORKS, RESULTS, ABOUT, CONTACT, EARLY

REPO = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(REPO, "public-site")
SITE = "https://radiantinnovatech.com"

# Switches. Flip FORMS_PAUSED to False only after the company is registered with the Data Protection
# Commission, and set FORMS_ENABLED=true on the Cloud Run service. Fill MATOMO_* only when our own
# Matomo server is running; the privacy notice then says so and the content security policy needs
# MATOMO_URL set on the service too.
FORMS_PAUSED = True
MATOMO_URL = ""      # for example https://stats.radiantinnovatech.com
MATOMO_SITE_ID = ""  # for example 1
ANALYTICS_ON = bool(MATOMO_URL and MATOMO_SITE_ID)

# ---------------------------------------------------------------------------------------- extra pages
SOLUTIONS = {"file": "pages/solutions.html", "path": "/pages/solutions.html",
 "title": "Who Hydra is for | Hydra",
 "description": "Hydra is for security teams in regulated Ghanaian institutions that collect alerts and do not have enough analysts to read them all.",
 "blocks": [
  ("h1", "Who Hydra is for"),
  ("lead", "Hydra is built for regulated Ghanaian institutions that collect alerts and do not have enough analysts to read them all. Today we work with their security teams. Once we are licensed, we plan to run it for them."),
  ("h2", "Banks, payment companies and fintechs"),
  ("p", "You run a small security team, or you do not have one. You may already collect alerts from tools such as Wazuh or Microsoft Defender. The Bank of Ghana's 2026 cybersecurity directive expects you to detect threats and respond to them. Hydra gives your team a first pass on every alert, and an evidence trail your auditors can follow. Once we hold our licence, we plan to run it for you."),
  ("h2", "Licensed cyber firms"),
  ("p", "If you run monitoring for clients, Hydra can be the first pass your analysts review. Today Hydra is a platform, and your analysts run the monitoring. Radiant does not run a customer's security operations centre yet. We plan to, once we are licensed, so tell us how you would want to work with us."),
  ("h2", "What Hydra recognises today"),
  ("p", "These examples come straight from the checks Hydra runs. Each has an attack and a harmless look-alike."),
  ("ol", [
    "**Credentials read from memory.** A program in a user's Downloads folder opens the process that holds passwords. Hydra flags it. When security software in a system folder does the same, Hydra treats it as a weak signal only.",
    "**A password spray.** Failed logons across ten or more accounts from an outside address look like an attack. Three failures on one account from inside the network look like a mistyped password.",
    "**Kerberos tickets in bulk.** Five or more tickets requested with weak encryption is a known attack on service accounts. One or two tickets with strong encryption is ordinary service access.",
  ]),
  ("link", "See every check, and how the verdict is made", "/pages/how-it-works.html"),
  ("h2", "Not yet"),
  ("p", "We are not built for air-gapped government networks, industrial control systems or telecom-scale traffic, and we would rather say so."),
  ("cta", "Talk to us", "/pages/contact.html"),
  ("small", "Last reviewed: 21 October 2026 by Samuel Maclar."),
 ]}

RESOURCES = {"file": "pages/resources.html", "path": "/pages/resources.html",
 "title": "Resources | Hydra",
 "description": "What we have published about how Hydra works, how we tested it, and how we protect it.",
 "blocks": [
  ("h1", "Resources"),
  ("lead", "We publish what exists. Right now that is three things."),
  ("h2", "Our test results"),
  ("p", "How we tested Hydra on 42 labelled alerts, the numbers, the five attacks it did not flag, and what the test does not show."),
  ("link", "Read our test results", "/pages/our-test-results.html"),
  ("h2", "How Hydra investigates an alert"),
  ("p", "What Hydra does with each alert, what its built-in checks look for, how the verdict is made, and where its limits are."),
  ("link", "Read how it works", "/pages/how-it-works.html"),
  ("h2", "How we keep Hydra safe"),
  ("p", "Every security control marked in place, in progress or planned. Our Security Overview gives the full detail, and we will send it to you on request."),
  ("link", "Read the Security page", "/pages/security.html"),
  ("link", "Ask for the Security Overview", "/pages/contact.html"),
  ("small", "Last reviewed: 21 October 2026 by Samuel Maclar."),
 ]}

from legal_pages import privacy as _privacy, TERMS
PRIVACY = _privacy(ANALYTICS_ON)

PAGES = [
  dict(HOME, file="index.html", path="/"),
  dict(HOWITWORKS, file="pages/how-it-works.html", path="/pages/how-it-works.html"),
  dict(SOLUTIONS),
  dict(SECURITY, file="pages/security.html", path="/pages/security.html"),
  dict(RESULTS, file="pages/our-test-results.html", path="/pages/our-test-results.html"),
  dict(WORKING, file="pages/working-with-us.html", path="/pages/working-with-us.html"),
  dict(ABOUT, file="pages/about.html", path="/pages/about.html"),
  dict(CONTACT, file="pages/contact.html", path="/pages/contact.html"),
  dict(EARLY, file="waitlist/index.html", path="/waitlist/"),
  dict(RESOURCES),
  dict(PRIVACY),
  dict(TERMS),
]

FORM_FIELDS = {  # page form id -> {our name: backend field}
  "contact-form": {"name": "full_name", "email": "email", "organisation": "company", "role": "role", "monitoring": "monitoring", "message": "message", "consent": "consent"},
  "early-access-form": {"name": "full_name", "email": "email", "title": "role", "organisation": "company", "country": "country", "role_type": "user_type", "use_case": "use_case", "consent": "consent"},
}
FORM_ENDPOINT = {"contact-form": "/api/contact/submit", "early-access-form": "/api/waitlist/submit"}

# ---------------------------------------------------------------------------------------- rendering
def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r"\[\[(.+?)\]\]", lambda m: '<mark class="todo">[[' + m.group(1) + ']]</mark>', t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"\[([^\[\]]+?)\]\((/[^)\s]*)\)", r'<a href="\2">\1</a>', t)
    return t

DIAGRAM = """<div class="investigation-flow" aria-label="From alert to analyst decision">
<div class="flow-heading"><span class="flow-eyebrow">FROM ALERT TO DECISION</span><span class="flow-status">Advice-only today</span></div>
<ol class="flow-steps">
<li><span class="flow-number" aria-hidden="true">01</span><div><h3>The alert arrives</h3><p>Your monitoring tools send an alert. Hydra keeps the original event.</p><span class="flow-detail">Original event preserved</span></div></li>
<li><span class="flow-number" aria-hidden="true">02</span><div><h3>Hydra gathers evidence</h3><p>It checks the event and brings together relevant context.</p><span class="flow-detail">Event + related context</span></div></li>
<li class="flow-check"><span class="flow-number" aria-hidden="true">03</span><div><h3>The verdict is checked</h3><p>The model proposes a verdict. Code checks the evidence and enforces the guards.</p><span class="flow-detail">Uncertain cases go to a person</span></div></li>
<li><span class="flow-number" aria-hidden="true">04</span><div><h3>Your analyst decides</h3><p>Your team reviews the findings and carries out any action in its own tools.</p><span class="flow-detail">Human review before action</span></div></li>
</ol>
<div class="flow-footer"><span aria-hidden="true">↳</span><p><strong>Evidence stays with the verdict.</strong> Your analyst can see what supports the finding.</p></div>
</div>"""

NAV = [("How it works", "/pages/how-it-works.html"), ("Who it is for", "/pages/solutions.html"), ("Security", "/pages/security.html"),
       ("Our test results", "/pages/our-test-results.html"), ("Working with us", "/pages/working-with-us.html"), ("About", "/pages/about.html")]

def header(path):
    cur = ' aria-current="page"'
    links = "".join('<a href="%s"%s>%s</a>' % (h, cur if h == path else "", html.escape(t)) for t, h in NAV)
    return f'''<a class="skip" href="#main">Skip to content</a>
<header class="site-header"><div class="wrap bar">
<a class="brand" href="/"><img src="/assets/brand/hydra-logo.svg" alt="Hydra" width="132" height="34"></a>
<nav class="desktop-nav" aria-label="Main">{links}</nav>
<div class="actions header-actions"><a class="btn btn-quiet" href="/waitlist/">Early access</a><a class="btn" href="/pages/contact.html">Talk to us</a></div>
<details class="mobile-menu">
<summary><span>Menu</span><svg class="menu-icon" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path class="menu-bars" d="M3 5h14M3 10h14M3 15h14"/><path class="menu-close" d="m4 4 12 12M16 4 4 16"/></svg></summary>
<div class="mobile-panel"><nav aria-label="Main on mobile">{links}</nav>
<div class="actions"><a class="btn" href="/pages/contact.html">Talk to us</a><a class="btn btn-quiet" href="/waitlist/">Early access</a></div></div>
</details>
</div></header>'''

FOOTER = '''<footer class="site-footer"><div class="wrap">
<div class="foot-grid">
<div><img src="/assets/brand/hydra-logo-on-dark.svg" alt="Hydra" width="120" height="31"><p class="foot-line">An AI analyst for your security team. Built in Accra.</p></div>
<div><h2>Hydra</h2><ul><li><a href="/pages/how-it-works.html">How it works</a></li><li><a href="/pages/solutions.html">Who it is for</a></li><li><a href="/pages/our-test-results.html">Our test results</a></li><li><a href="/pages/resources.html">Resources</a></li></ul></div>
<div><h2>Company</h2><ul><li><a href="/pages/about.html">About</a></li><li><a href="/pages/security.html">Security</a></li><li><a href="/pages/working-with-us.html">Working with us</a></li><li><a href="/pages/contact.html">Talk to us</a></li></ul></div>
<div><h2>Legal</h2><ul><li><a href="/pages/privacy.html">Privacy notice</a></li><li><a href="/pages/terms.html">Terms of use</a></li><li><a href="/.well-known/security.txt">Report a vulnerability</a></li></ul></div>
</div>
<p class="copy">&copy; 2026 Radiant InnovaTech</p>
</div></footer>'''

FORM_JS = '''<script>
(function () {
  document.querySelectorAll("form[data-endpoint]").forEach(function (form) {
    var ok = form.parentNode.querySelector(".form-success"), bad = form.parentNode.querySelector(".form-error");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (ok) ok.hidden = true; if (bad) bad.hidden = true;
      var data = {}; new FormData(form).forEach(function (v, k) { data[k] = v; });
      data.consent = form.querySelector('[name="consent"]').checked;
      var btn = form.querySelector("button[type=submit]"); btn.disabled = true;
      fetch(form.getAttribute("data-endpoint"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
        .then(function (res) {
          if (res.ok) { form.hidden = true; if (ok) { ok.hidden = false; ok.focus(); } }
          else { if (bad) { bad.textContent = res.body && res.body.error ? res.body.error : bad.textContent; bad.hidden = false; } btn.disabled = false; }
        })
        .catch(function () { if (bad) bad.hidden = false; btn.disabled = false; });
    });
  });
})();
</script>'''

def render_blocks(p):
    blocks = p["blocks"]
    hero, rest = [], []
    seen_h2 = False
    for b in blocks:
        if b[0] == "h2": seen_h2 = True
        (rest if seen_h2 else hero).append(b)
    o = ['<section class="hero"><div class="wrap narrow">']
    for b in hero: o.append(render_block(b, p))
    o.append("</div></section>")
    sec, open_ = [], False
    for b in rest:
        if b[0] == "h2":
            if open_: o.append("</div></section>")
            o.append('<section class="sec"><div class="wrap narrow">'); open_ = True
        o.append(render_block(b, p))
    if open_: o.append("</div></section>")
    return "\n".join(o)

def render_block(b, p):
    k = b[0]
    if k == "h1": return f"<h1>{inline(b[1])}</h1>"
    if k == "h2": return f"<h2>{inline(b[1])}</h2>"
    if k == "h3": return f"<h3>{inline(b[1])}</h3>"
    if k == "eyebrow": return f'<p class="eyebrow">{inline(b[1])}</p>'
    if k == "lead": return f'<p class="lead">{inline(b[1])}</p>'
    if k == "p": return f"<p>{inline(b[1])}</p>"
    if k == "small": return f'<p class="note">{inline(b[1])}</p>'
    if k == "cta": return f'<p><a class="btn btn-lg" href="{b[2]}">{inline(b[1])}</a></p>'
    if k == "link": return f'<p><a class="more" href="{b[2]}">{inline(b[1])} &rarr;</a></p>'
    if k == "ul": return "<ul>" + "".join(f"<li>{inline(x)}</li>" for x in b[1]) + "</ul>"
    if k == "ol": return "<ol>" + "".join(f"<li>{inline(x)}</li>" for x in b[1]) + "</ol>"
    if k == "table":
        rows = b[1]
        t = '<div class="tablewrap"><table><thead><tr>' + "".join(f"<th>{inline(c)}</th>" for c in rows[0]) + "</tr></thead><tbody>"
        for r in rows[1:]: t += "<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>"
        return t + "</tbody></table></div>"
    if k == "figure":
        if p["file"].endswith("how-it-works.html"):
            return f'<figure>{DIAGRAM}<figcaption>{inline(b[2])}</figcaption></figure>'
        if b[1].startswith("/assets/"):
            src, alt = b[1].split("|", 1)
            return f'<figure><img src="{src}" alt="{alt}" width="666" height="659" loading="lazy"><figcaption>{inline(b[2])}</figcaption></figure>'
        return f'<figure><p class="todo-image">{inline(b[1])}</p><figcaption>{inline(b[2])}</figcaption></figure>'
    if k == "faq": return "".join(f"<h3>{inline(q)}</h3><p>{inline(a)}</p>" for q, a in b[1])
    if k == "founders":
        return '<div class="founders">' + "".join(
            f'<article class="founder"><img src="{img}" alt="Portrait of {html.escape(name)}" width="220" height="220" loading="lazy"><div><h3>{html.escape(title)}</h3><p>{inline(bio)}</p></div></article>'
            for name, title, bio, img in b[1]) + "</div>"
    if k == "form" and FORMS_PAUSED:
        return ('<div class="notice" role="note"><p><strong>Our forms are switched off for now.</strong> We are not yet registered with Ghana\'s Data Protection Commission, '
                'and we will not collect your details through this website until we are.</p>'
                '<p>To reach us, write to <a href="mailto:samuelmaclar@radiantinnovatech.com">samuelmaclar@radiantinnovatech.com</a> or call 050 455 5100. One of the founders replies within two working days.</p></div>')
    if k == "state" and FORMS_PAUSED: return ""
    if k == "form":
        fid, fields, label, hp = b[1], b[2], b[3], b[4]
        m = FORM_FIELDS[fid]
        f = [f'<form id="{fid}" method="post" action="{FORM_ENDPOINT[fid]}" data-endpoint="{FORM_ENDPOINT[fid]}">']
        if hp: f.append('<p class="visually-hidden" aria-hidden="true"><label>Leave this empty <input type="text" name="_hp" tabindex="-1" autocomplete="off"></label></p>')
        for lab, name, typ, req, opts in fields:
            n = m[name]; r = " required" if req else ""
            if typ == "checkbox":
                f.append(f'<p class="check"><label><input type="checkbox" name="{n}"{r}> <span>{inline(lab)}</span></label></p>')
            elif typ == "select":
                f.append(f'<p><label for="{fid}-{n}">{inline(lab)}</label><select id="{fid}-{n}" name="{n}"{r}><option value="">Select</option>' + "".join(f"<option>{html.escape(x)}</option>" for x in opts) + "</select></p>")
            elif typ == "textarea":
                f.append(f'<p><label for="{fid}-{n}">{inline(lab)}</label><textarea id="{fid}-{n}" name="{n}" rows="5" maxlength="2000"{r}></textarea></p>')
            else:
                f.append(f'<p><label for="{fid}-{n}">{inline(lab)}</label><input id="{fid}-{n}" name="{n}" type="{typ}" maxlength="200"{r}></p>')
        f.append(f'<p><button class="btn btn-lg" type="submit">{html.escape(label)}</button></p></form>')
        return "\n".join(f)
    if k == "state":
        return f'<p class="form-{b[1]}" role="status" tabindex="-1" hidden>{inline(b[2])}</p>'
    raise ValueError(k)

def about_blocks(blocks):
    """Replace the figure and the four h3+p founder entries on About with portraits."""
    team = "/assets/team/"
    founders = [
      ("Samuel N. K. A. Maclar", "Samuel N. K. A. Maclar, co-founder and CEO", "Cybersecurity, University of Mines and Technology. Full-stack, security and AI engineer. Leads product direction and fundraising, and built the investigation engine and the integrations with the team.", team + "samuelmaclar.web.jpg"),
      ("Christian Dwamena Agyapong", "Christian Dwamena Agyapong, co-founder and CTO", "University of Ghana; machine learning certified. Owns the platform architecture, the infrastructure and the AI investigation core.", team + "christandwamena.jpeg"),
      ("Priscilla Anane", "Priscilla Anane, co-founder and CFO", "Banking and Finance, KNUST, on the investment-banking track, with experience at CAL Asset Management. Owns finance, modelling, runway and fundraising operations.", team + "priscillaanane.jpeg"),
      ("Jojo K. O. Boateng", "Jojo K. O. Boateng, co-founder and security lead", "Cybersecurity, University of Mines and Technology. Owns detection logic, threat modelling and the mapping to MITRE ATT&CK.", team + "jojoboateng.jpeg"),
    ]
    out, skip = [], False
    for b in blocks:
        if b[0] == "figure": continue
        if b[0] == "h3": continue
        if b[0] == "p" and b[1].startswith(("Cybersecurity, University", "University of Ghana", "Banking and Finance")): continue
        out.append(b)
        if b[0] == "h2" and b[1] == "The founders": out.append(("founders", founders))
    return out

PAUSED_LEAD = "Write or call us. One of the founders reads every message and replies within two working days. If it helps, we will show you Hydra investigating a test alert, using data from our lab."

MATOMO_SNIPPET = ('<script>var _paq=window._paq=window._paq||[];_paq.push(["setDoNotTrack",true]);_paq.push(["disableCookies"]);_paq.push(["trackPageView"]);'
  '_paq.push(["enableLinkTracking"]);(function(){var u="%s/";_paq.push(["setTrackerUrl",u+"matomo.php"]);_paq.push(["setSiteId","%s"]);'
  'var d=document,g=d.createElement("script"),s=d.getElementsByTagName("script")[0];g.async=true;g.src=u+"matomo.js";s.parentNode.insertBefore(g,s);})();</script>') % (MATOMO_URL.rstrip("/"), MATOMO_SITE_ID)

def page_html(p):
    path = p["path"]
    blocks = about_blocks(p["blocks"]) if p["file"].endswith("pages/about.html") else p["blocks"]
    if FORMS_PAUSED and any(x[0] == "form" for x in blocks):
        blocks = [("lead", PAUSED_LEAD) if x[0] == "lead" else x for x in blocks]
    q = dict(p, blocks=blocks)
    body = render_blocks(q)
    title = html.escape(p["title"]); desc = html.escape(p["description"])
    url = SITE + (path if path != "/" else "/")
    legal = "<!-- LEGAL-REVIEW-PENDING: remove this line when Priscilla and the lawyer have approved this page -->\n" if p.get("legal_review") else ""
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website"><meta property="og:site_name" content="Hydra"><meta property="og:title" content="{title}"><meta property="og:description" content="{desc}"><meta property="og:url" content="{url}"><meta property="og:image" content="{SITE}/assets/brand/og-image-light.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/brand/favicon.ico" sizes="any"><link rel="icon" type="image/svg+xml" href="/assets/brand/favicon.svg"><link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/site.css?v=20261026">
<script src="/js/navigation.js" defer></script>
</head>
<body>
{legal}{header(path)}
<main id="main">
{body}
</main>
{FOOTER}
{FORM_JS if "<form" in body else ""}
{MATOMO_SNIPPET if ANALYTICS_ON else ""}
</body>
</html>
'''

for p in PAGES:
    dest = os.path.join(OUT, p["file"])
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, "w").write(page_html(p))
    print("wrote", p["file"])
