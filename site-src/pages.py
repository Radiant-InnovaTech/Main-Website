# The words on the site, in one place. Edit here, then run: python3 site-src/build_site.py
# Inline link syntax: [text](href). Placeholders to fill: [[like this]].
HOME = {
 "file": "home",
 "title": "Hydra | An AI analyst for your security team",
 "description": "Hydra investigates each security alert, shows the evidence behind its verdict, and never acts without a person's approval. Built in Accra for banks and fintechs.",
 "blocks": [
  ("eyebrow", "Built in Accra for security teams"),
  ("h1", "Hydra investigates every alert and shows its working."),
  ("lead", "Your analysts get a verdict on each alert, with the evidence behind it, before they open it. Hydra never changes your systems unless a person approves."),
  ("cta", "Talk to us about an evaluation", "/pages/contact.html"),
  ("link", "See how an investigation works", "/pages/how-it-works.html"),
  ("small", "Early stage. Hydra works in our lab and we are looking for our first evaluation partners."),

  ("h2", "Too many alerts, too few people"),
  ("p", "Most of what your monitoring tools raise is harmless. A few alerts are not, and they look the same until someone digs. That digging is slow, it depends on who is on shift, and it is hard to show an auditor afterwards."),
  ("p", "The Bank of Ghana's 2026 cybersecurity directive expects regulated institutions to detect threats and respond to them. Good analysts are hard to find. We built Hydra to give a small team a first pass on every alert."),

  ("h2", "What Hydra does with an alert"),
  ("ol", [
    "**It arrives.** Your monitoring tools send the alert to Hydra: Wazuh, Splunk, Microsoft Defender and others. Hydra keeps the full original event.",
    "**It checks the event.** Hydra looks at what the event itself shows. Did a program in a user's Downloads folder read the memory that holds passwords? Did Word start PowerShell with an encoded command? 35 patterns like these are built in, and each one is explained in plain words.",
    "**It looks around.** It finds other alerts on the same machine or user, and what your analysts decided about similar alerts before.",
    "**It writes a verdict.** An AI model reads what Hydra gathered and writes one of three verdicts: attack, harmless, or needs a person. Every verdict lists the evidence it relies on.",
    "**Rules check the AI.** Hydra's own rules can overrule the model. If the event shows a strong attack pattern, the model cannot dismiss it. If the evidence is thin, the verdict is \"needs a person\".",
    "**A person decides.** Hydra may recommend isolating a computer or disabling an account. Nothing happens until someone with the right role approves it, and every decision is logged.",
  ]),

  ("h2", "An investigation, opened"),
  ("figure", "/assets/screenshots/investigation-lsass.png|A Hydra investigation of a credential-dumping alert: four numbered steps, the verdict 'True positive' with a score of 62 out of 100, the reason for the score, and what the verdict cites.",
             "A real investigation from our lab, run on recorded public attack test data with a made-up laptop and user. Each line of evidence points to a numbered step. The product screen labels the evidence score \"Confidence\"."),

  ("p", "The evidence score runs from 0 to 100 and measures how much evidence points to an attack. It is not a probability. It rises when the event shows attack patterns or other alerts on the same machine or user agree. It falls when the event matches routine activity."),

  ("h2", "You stay in charge"),
  ("p", "Hydra recommends. You decide. A person with the right role approves every action before anything runs. A kill switch stops all actions at once. Every decision goes into an audit log in which a changed or deleted entry can be detected."),
  ("p", "Today Hydra runs in advice-only mode: it does not change anything in your systems at all. [How we keep Hydra safe, and where we are](/pages/security.html)"),

  ("h2", "What we have measured, and what we have not"),
  ("p", "We tested Hydra's built-in checks on 42 labelled alerts: 18 real attacks and 24 harmless look-alikes. 20 came from recorded real-world attack data and 22 we wrote ourselves."),
  ("table", [["What we measured", "Result"],
             ["Alerts tested", "42 (18 attacks, 24 harmless)"],
             ["Attacks flagged", "13 of 18"],
             ["Harmless alerts cleared", "19 of 24"],
             ["Attacks dismissed", "0"],
             ["Harmless alerts called attacks", "0"]]),
  ("p", "That is a small test, partly written by us, and nobody outside the company has relabelled it. It shows the checks work on these patterns. It does not show how Hydra will do on your alerts. That is what a shadow evaluation is for."),
  ("small", "Figures from [[date of the benchmark run]]. We re-run the test whenever the checks change and update this page the same day."),
  ("link", "Read the test in full", "/pages/our-test-results.html"),

  ("h2", "Connectors we have built"),
  ("p", "Hydra can read alerts from Wazuh, Splunk, Microsoft Sentinel, Microsoft Defender, CrowdStrike Falcon, Microsoft Entra ID, Okta, Google Workspace, AWS GuardDuty and Google Cloud, and from an on-premises Active Directory relay. A Palo Alto Networks connector can block an address once a person approves it."),
  ("p", "Wazuh is the one we have tested end to end in our own lab. The others are built, most of them with automated tests, and we will prove each one with the first team that uses it."),
  ("small", "On our list, not built yet: SentinelOne, VMware Carbon Black, Cisco Umbrella, Fortinet, Elastic, Sumo Logic, ServiceNow, PagerDuty, Jira, Qualys."),

  ("h2", "Four people in Accra"),
  ("p", "We met on a security internship at Telecel Ghana. Three of us are cybersecurity engineers and one is a finance lead. [[SAMUEL: add two or three sentences in your own words about one specific thing you saw that made you build this.]]"),
  ("link", "Meet the team", "/pages/about.html"),

  ("h2", "Start with a shadow evaluation"),
  ("p", "Hydra reads your alerts for six weeks and writes down what it would conclude. It changes nothing. Your analysts keep doing their work, and at the end you compare the two."),
  ("p", "We will not start with a customer until the Cyber Security Authority has confirmed our licence position in writing. We are glad to talk before then."),
  ("cta", "Talk to us", "/pages/contact.html"),
  ("small", "Last reviewed: [[date]] by [[name]]."),
 ]}

WORKING = {
 "file": "working-with-us",
 "title": "Working with us | Hydra",
 "description": "How we work with a new security team: a conversation, clear terms, a free six-week shadow evaluation, a weekly comparison, and your decision.",
 "blocks": [
  ("h1", "Working with us"),
  ("lead", "We are early, so we work closely with each team. Here is what happens, in order."),

  ("h2", "1. Talk"),
  ("p", "A call of about 30 minutes. We ask how you monitor today and what your team spends its time on. You ask us anything, including the uncomfortable questions."),
  ("h2", "2. Agree the terms"),
  ("p", "Before any data moves, we agree a short evaluation agreement and a data processing agreement. We give you the exact list of read-only permissions we need."),
  ("p", "We do not start with a customer until the Cyber Security Authority has confirmed our licence position in writing."),
  ("h2", "3. A six-week shadow evaluation"),
  ("p", "Hydra reads your alerts and writes down what it would conclude. It changes nothing. Your analysts work as normal."),
  ("h2", "4. Compare"),
  ("p", "Every week we show you where Hydra and your analysts agreed and where they did not, and why. At the end you get a written report."),
  ("h2", "5. You decide"),
  ("p", "If it is useful, we agree terms to continue. If not, we delete your data within 30 days, and from our backups within 90 days, and confirm in writing."),

  ("h2", "What it costs"),
  ("p", "The evaluation is free. After that we quote in writing, based on the size of your institution and what you want Hydra to cover. We have not published a price list because we have not yet had a customer to test one with."),

  ("h2", "Questions"),
  ("faq", [
    ("Where does my data go?", "To Hydra, which we host on Google Cloud in Iowa, in the United States. You choose whether alerts are read by Google's Gemini model or by an open model we run ourselves. We do not train models on your data. Our [Security page](/pages/security.html) lists every provider that handles it."),
    ("What access do you need?", "Read-only access to the tools you connect. We send you the list of permissions before you set anything up. Hydra reads alert details. It does not read file contents, email contents, passwords or payment card data, and we ask you not to send those."),
    ("Does Hydra change anything in our systems?", "No. Hydra is advice-only today. A person carries out any action it recommends, in your own tools."),
    ("Can we run it on our own servers?", "Not yet. We host it today."),
    ("Do you run our security monitoring?", "No. Your analysts do. Hydra is a tool for them."),
    ("How long does an evaluation take to set up?", "[[CHRISTIAN: give a real figure from the lab, for example how long it took to connect Wazuh, or say we will tell you once we have scoped your tools.]]"),
    ("Who can I call?", "[[Name]], [[phone]], [[email]]."),
  ]),
  ("cta", "Talk to us", "/pages/contact.html"),
  ("small", "Last reviewed: [[date]] by [[name]]."),
 ]}

SECURITY = {
 "file": "security",
 "title": "Security and where we are | Hydra",
 "description": "How Hydra is built and protected, with every control marked in place, in progress or planned. We say plainly what we have not done yet.",
 "blocks": [
  ("h1", "How we keep Hydra safe, and where we are"),
  ("lead", "We mark every control as in place, in progress or planned, so you can see exactly where we are. Where something is not done, we say so."),
  ("p", "The full description is our Security Overview. [[Link: Download the Security Overview (PDF) once it is published]]. We will also send it to you on request."),

  ("h2", "In place today"),
  ("h3", "Hydra recommends. A person decides."),
  ("ul", [
    "**Advice-only operation.** Hydra does not isolate hosts, disable accounts, block addresses or change anything in your systems. A person approves any action it recommends and carries it out in your own tools.",
    "**A global kill switch** stops all actions at once.",
    "**An optional triage feature** can close routine alerts. It is off by default for evaluations and runs in a record-only mode first. It never closes an alert rated critical, has an hourly limit, and its decisions can be reversed.",
  ]),
  ("h3", "How the AI is kept in check"),
  ("ul", [
    "Every verdict must cite the evidence it relies on. Hydra's own detection rules check the model's answer, and Hydra answers \"needs context\" when it cannot decide.",
    "Alert content is treated as untrusted data. The AI is told not to follow any instruction found inside an alert, which protects against prompt injection.",
    "We do not train AI models on customer data, and we do not allow our model providers to.",
    "The AI service has its own read-only identity. It cannot approve or carry out anything.",
    "Analysts mark each verdict Agree or Disagree. During an evaluation we report agreement, and any attack Hydra dismissed, to you every week.",
  ]),
  ("h3", "Who can do what"),
  ("ul", [
    "Sign-in is handled by an identity provider, with multi-factor authentication available and enforceable for a whole workspace.",
    "Five roles (viewer, analyst, manager, admin, owner) separate reading, investigating, approving actions and changing configuration.",
  ]),
  ("h3", "Protecting data"),
  ("ul", [
    "Traffic to Hydra uses HTTPS only. Our database and storage encrypt data at rest.",
    "Credentials you store in Hydra to connect your tools are additionally encrypted by Hydra with AES-256-GCM.",
    "Keys and passwords are kept out of our source code and delivered to the services when they run.",
    "Hydra reads alert details. It does not read file contents, email contents, passwords or payment card data.",
    "When an agreement ends, we delete your data within 30 days, and from our backups within 90 days, and confirm in writing if you ask.",
  ]),
  ("h3", "Infrastructure and software"),
  ("ul", [
    "Services run in containers as non-root users, and a default-deny network policy blocks traffic between services unless it is explicitly allowed.",
    "Calls from Hydra to an address you configure are checked so they cannot be pointed at private networks or the cloud metadata service.",
    "Every change is made by pull request and tested before release. The code has more than 300 automated tests, including tests of customer separation and of the safeguards that stop Hydra acting on its own.",
    "Releases use fixed images and roll back automatically if the new version does not start. A database backup is taken before each release, and daily backups are kept for 14 days.",
  ]),
  ("h3", "An audit trail"),
  ("ul", [
    "Every action Hydra takes, every decision a person makes and every configuration change is recorded. Each entry includes the hash of the one before it, so a changed or deleted entry can be detected. You can see your workspace's audit trail.",
  ]),

  ("h2", "In progress"),
  ("ul", [
    "**Separation between customers.** Every record belongs to a workspace and every query is scoped to it. We apply database row-level security and are confirming it is enforced under the application's database account. We will report the result.",
    "**A formal access review** for our own staff's access to production.",
    "**An incident response procedure,** covering how we detect, contain and investigate an incident and how we notify customers and regulators.",
    "**Alerts and monitoring** for crashes, failed sign-ins and unusual traffic, with a rota for who responds.",
    "**Recovery drills.** We will test a restore from backup into a clean database at least twice a year. The first drill is scheduled.",
    "**Mandatory second review** of every code change, and automated checks on every pull request.",
    "**Dependency updates.** We audit dependencies on each release and are completing an update of our main framework and database packages.",
    "**Our licence.** We are applying to Ghana's Cyber Security Authority for a Cybersecurity Service Provider licence.",
  ]),

  ("h2", "Planned, not yet started"),
  ("ul", [
    "**An independent penetration test,** during the first evaluations.",
    "**ISO 27001 and SOC 2.** We are scoping both. We have not started, and we do not hold either.",
    "**A web application firewall and shared rate limiting** at the network edge. Rate limiting is applied in the application today.",
    "**High availability, point-in-time recovery and agreed recovery targets,** before we offer a service level. During an evaluation we do not promise one.",
  ]),

  ("h2", "Where your data goes"),
  ("table", [["Provider", "What it does", "Where"],
             ["Google Cloud", "Hosts Hydra, its database, storage and backups", "United States (Iowa)"],
             ["Google Vertex AI", "Hosted AI model, only if you choose it", "United States"],
             ["Clerk", "Sign-in and accounts", "United States"],
             ["Brevo", "Email notifications, only if enabled", "European Union"],
             ["mNotify", "Text-message notifications, only if enabled", "Ghana"]]),
  ("p", "We will tell you 14 days before we add a provider that handles your data. You can also choose an open AI model that we run ourselves, so that alerts are not sent to Google's model."),

  ("h2", "Licensing, stated plainly"),
  ("p", "Radiant is a Ghanaian company applying for a Cybersecurity Service Provider licence from Ghana's Cyber Security Authority. We will not provide Hydra to a customer until we are licensed or the Authority has confirmed in writing that the activity does not need a licence. We do not run a customer's security operations centre. Your analysts run the monitoring."),

  ("h2", "Report a problem"),
  ("p", "To report a vulnerability or ask a security question, write to [[security email address]]. We reply within two business days and will not take action against anyone who reports in good faith."),
  ("small", "Last reviewed: [[date]] by [[name]]."),
 ]}

HOWITWORKS = {
 "file": "how-it-works",
 "title": "How Hydra investigates an alert | Hydra",
 "description": "What Hydra does with each security alert, what it checks, how the verdict is made, where your data goes, and where its limits are.",
 "blocks": [
  ("h1", "How Hydra investigates an alert"),
  ("lead", "This page explains what Hydra does with each alert, what it checks, how the verdict is made, and where its limits are. We wrote it for a security manager who wants to know exactly what they would be switching on."),
  ("figure", "[[DIAGRAM: four plain boxes joined by arrows. Your tools send the alert. Hydra investigates. Your analysts decide. Your tools act, only when you approve. No glow, no icons that need explaining. Remove this line before publishing.]]",
            "The path of an alert through Hydra."),

  ("h2", "1. The path of an alert"),
  ("ol", [
    "**The alert arrives.** Your monitoring tools send it to Hydra, or Hydra collects it from them. Hydra stores it under your organisation's own workspace and keeps the full original event, not only a summary.",
    "**Hydra checks the event.** It looks at what the event itself shows, using the built-in patterns described in section 2. This step needs no AI and no network.",
    "**Hydra gathers context.** It links the alert to the machine, user and addresses involved, finds other alerts that share them, and reads what your analysts decided about similar alerts before. If a reputation lookup has been run for the addresses and files involved, Hydra uses its result.",
    "**An AI model writes the verdict.** The model reads everything Hydra gathered and returns one of three verdicts: attack, harmless, or needs a person. It must cite the numbered steps its verdict relies on.",
    "**Hydra's rules check the model.** The rules can overrule the model. Section 3 explains how.",
    "**Hydra saves the result.** The verdict, the evidence score, every step and an audit entry are stored. If the verdict is a likely attack, Hydra can notify the contact you chose and prepare recommended actions for a person to approve.",
  ]),

  ("h2", "2. What the built-in checks look for"),
  ("p", "Hydra has 35 built-in checks. Some recognise attack patterns and some recognise routine activity, so the same kind of event can be cleared as well as flagged. Each check names the technique or the normal activity it recognises, so every point it adds can be explained. Here are eight families, each with a harmless look-alike."),
  ("table", [["What the event looks like", "Why it matters", "A look-alike Hydra treats differently"],
             ["A program in a user's Downloads folder opens the process that holds passwords", "A common way to steal credentials", "Security software in a system folder reading the same memory is only a weak signal, because abused system tools can do it too"],
             ["Word or Excel starts PowerShell or another script program", "A typical sign of a malicious document", "Installed software started by another system program, with nothing odd in its arguments, is treated as routine"],
             ["PowerShell with an encoded command and a hidden window", "Used to hide what a script does", "An ordinary command with readable arguments does not trigger it"],
             ["Shadow copies or backups deleted with built-in tools", "Often the step before ransomware", "None needed: this is rarely done for ordinary reasons, so it carries a high weight"],
             ["Failed logons across ten or more accounts from an outside address", "Password spraying", "Three failures on one account from an internal address look like a mistyped password"],
             ["Five or more Kerberos tickets requested with weak encryption", "Kerberoasting, an attack on service accounts", "One or two tickets with strong encryption are ordinary service access"],
             ["Someone added to Domain Admins, especially from a machine that is not a domain controller", "Privilege escalation", "Someone added to the ordinary Users group is routine onboarding"],
             ["A program starts listening on an unusual port", "Can be a hidden backdoor", "A vendor agent using a high temporary port is normal"]]),
  ("p", "**Where these checks apply.** Today the built-in checks cover Windows events, as recorded by Sysmon or the Windows security log. For alerts from Okta, AWS, Google Cloud or Linux hosts, Hydra relies on the AI model and the evidence it gathers, because we have not yet written built-in checks for them. We are adding them, and we will say so here when they exist."),

  ("h2", "3. How the verdict is made"),
  ("p", "There are three verdicts: **attack** (a true positive), **harmless** (a false positive), and **needs a person** (needs context). The AI model proposes one. Hydra's rules then check it."),
  ("ul", [
    "If the event shows a strong attack pattern, the model cannot dismiss it. A model that says \"harmless\" is overruled and the alert goes to a person.",
    "If the event matches routine activity and shows no attack pattern, the model's \"harmless\" is accepted only with evidence cited.",
    "A verdict with no cited evidence becomes \"needs a person\". So does any verdict whose citations do not point to real steps.",
    "If the evidence is thin, a model that says \"attack\" is not accepted on its own. The verdict becomes \"needs a person\".",
    "The AI never sets the evidence score. Hydra calculates it.",
  ]),
  ("p", "If the AI model is unavailable, Hydra does not make up a verdict. The alert waits, and an analyst can press Run investigation."),

  ("h2", "4. The evidence score"),
  ("p", "Every verdict has an evidence score from 0 to 100. It measures how much evidence points to an attack. It is not a probability, and a score of 95 does not mean \"right 95 times out of 100\"."),
  ("p", "The score starts low and adds up evidence. It rises when the event itself shows attack patterns, when other alerts on the same machine or user agree, and when a reputation lookup flags an address or file. It falls when the event matches routine activity, or when your analysts have often called this alert harmless. Each factor is listed beside the score, so you can see why it is what it is."),
  ("p", "On its own, what the event shows can lift the score to at most 80. Going higher needs something outside the event to agree. That is deliberate: the score that could ever allow an action without a person is set high on purpose."),

  ("h2", "5. Actions and approvals"),
  ("p", "Hydra can recommend isolating a computer, disabling an account, resetting a user's sessions, blocking an address, or revoking a cloud access key. It does this through Microsoft Defender, CrowdStrike, Microsoft Entra ID, Okta, Google Workspace, Palo Alto Networks and AWS, depending on where the alert came from."),
  ("ul", [
    "**A person approves each one.** Only people with the manager, admin or owner role can approve. Analysts and viewers cannot.",
    "**Advice-only today.** Hydra does not run any of these actions yet. It records the approval, and your team carries it out in your own tools.",
    "**A kill switch** stops every action at once.",
    "**Most actions can be undone,** and the undo is recorded too.",
    "**Every decision is logged** in an audit trail in which a changed or deleted entry can be detected.",
    "**An optional setting** can let one kind of action run without a person, but only above a very high evidence score. It is off by default and we do not turn it on in evaluations.",
  ]),

  ("h2", "6. What else an analyst can do"),
  ("ul", [
    "**Ask questions about an alert** in a chat. The assistant is told to rely on the alert's evidence and never to claim that an action was taken.",
    "**Produce an incident report** from an alert, review it, and export it as a PDF.",
    "**Mark a verdict agree or disagree.** Those marks feed how often Hydra's calls match your analysts' calls, and the false-positive rate it uses next time.",
  ]),

  ("h2", "7. Where your data goes"),
  ("p", "Hydra is hosted by us on Google Cloud in Iowa, in the United States. The AI model can be Google's Gemini on Vertex AI, or an open model that we run ourselves. Alert text is sent to whichever model you choose. We do not train models on your data. Hydra reads alert details, not file contents, email contents, passwords or payment card data. The full list of providers is on our [Security page](/pages/security.html)."),

  ("h2", "8. What Hydra does not do yet"),
  ("ul", [
    "The built-in checks cover Windows events only.",
    "While it investigates, Hydra does not run new queries against your own tools. It works from the alert and from what it has stored.",
    "Hydra does not run reputation lookups on its own yet. An analyst can run one, and Hydra then uses the result.",
    "We have measured accuracy only on our own test of 42 alerts. [Read it in full](/pages/our-test-results.html).",
    "We have no customers yet.",
    "We do not offer on-premises or air-gapped deployment. We host Hydra.",
    "We do not run your security monitoring. Your analysts do.",
  ]),

  ("h2", "9. What we are working on next"),
  ("p", "These are plans, not features, and we are not giving dates."),
  ("ul", [
    "Read-only questions to your own tools during an investigation, inside limits you set.",
    "Keeping the full evidence behind each step, not only a summary of it.",
    "Built-in checks for identity and cloud alerts.",
    "Scheduled threat hunts.",
  ]),
  ("cta", "Talk to us about an evaluation", "/pages/contact.html"),
  ("small", "Last reviewed: [[date]] by [[name]]."),
 ]}

RESULTS = {
 "file": "our-test-results",
 "title": "Our test results | Hydra",
 "description": "How we tested Hydra on 42 labelled alerts, the results, the five attacks it did not flag, and the limits of the test.",
 "blocks": [
  ("h1", "Our test results"),
  ("lead", "We tested Hydra on 42 labelled alerts. This page gives the results, the cases it got wrong, and what the test does not show. Please read the limits as carefully as the numbers."),
  ("small", "Results as of [[date of the run]]. We re-run the test whenever the checks change and update this page the same day."),

  ("h2", "The test"),
  ("ul", [
    "**42 alerts:** 18 real attacks and 24 harmless look-alikes.",
    "**20 from recorded real-world data.** These come from public attack recordings (OTRF Security-Datasets, MIT licence). The attack tool's own events are labelled as attacks. The other events from the same recordings are labelled harmless.",
    "**22 we wrote ourselves** from well-known attack and normal patterns: a Word document starting PowerShell, Kerberoasting, password spraying, backup software, patching, VPN logons and so on.",
    "**Titles and severity do not give away the answer.** Alerts are titled and rated by the rule that fired, never by the label, and a test checks that severity does not separate attacks from harmless alerts within a rule.",
    "**A new customer's situation.** We removed anything a brand-new customer would not have yet: stored reputation lookups, related alerts and analyst history.",
  ]),
  ("h3", "How we score it"),
  ("table", [["Measure", "What it means"],
             ["Attacks flagged", "Real attacks Hydra called an attack"],
             ["Attacks dismissed", "Real attacks Hydra called harmless. This is the dangerous mistake. The target is zero."],
             ["Harmless alerts cleared", "Harmless alerts Hydra called harmless: the noise it removes"],
             ["Harmless alerts called attacks", "False alarms"],
             ["Left to a person", "Alerts Hydra said needs a person, whichever the truth"]]),

  ("h2", "The results"),
  ("table", [["Set-up", "Attacks flagged", "Harmless cleared", "Attacks dismissed", "Harmless called attacks", "Time per alert"],
             ["Hydra's built-in checks only, no AI", "13 of 18", "19 of 24", "0", "0", "Under a second"],
             ["Checks plus Foundation-Sec 8B (open model, one NVIDIA L4 GPU)", "13 of 18", "19 of 24", "0", "0", "28 seconds"],
             ["Checks plus Granite 4.1 3B (small open model, a laptop), run before our latest fixes", "12 of 18", "19 of 24", "0", "0", "25 seconds"]]),
  ("p", "Every attack Hydra did not flag was passed to a person as \"needs a person\". None was called harmless."),
  ("h3", "What the AI alone does without the checks"),
  ("table", [["AI model on its own", "Attacks flagged", "Attacks dismissed", "Harmless called attacks"],
             ["Granite 4.1 3B, given Hydra's behaviour analysis", "16 of 18", "2 of 18", "1 of 24"],
             ["Granite 4.1 3B, without the behaviour analysis", "16 of 18", "1 of 18", "15 of 24"],
             ["Foundation-Sec 8B, given the behaviour analysis", "18 of 18", "0 of 18", "0 of 24"]]),
  ("p", "This is why Hydra has rules around the model. A small model on its own dismissed real attacks, and without the analysis it called most harmless alerts attacks. With the checks in place, no attack was dismissed. We have **not** yet run this test on the model we use in our hosted service (Google's Gemini 2.5 Pro). We will, and we will publish the result."),

  ("h2", "The five attacks it did not flag"),
  ("p", "We list them because you should know where the checks are weak."),
  ("ul", [
    "A memory-dumping tool running from a user's Desktop folder, seen on its own as a program starting. Hydra only noted that it ran from a folder anyone can write to.",
    "A reconnaissance command (queries about the user, the system or accounts). Hydra noted it as weak evidence.",
    "A program listening for connections on port 8000.",
    "Two reads of the Windows Credential Manager vault.",
  ]),
  ("p", "Each of these scored too low for Hydra to call an attack, so each went to a person. We will review them with the detection owner. Any change we make from now on will be tested on alerts we have not looked at."),
  ("p", "Five harmless alerts were also left to a person rather than cleared: two ordinary logons, two process starts and one registry change."),

  ("h2", "What this test does not show"),
  ("ul", [
    "**It is small.** With 18 attacks, zero dismissed does not prove the true rate is zero. As a rough rule, the true rate could be as high as about 17%. Showing a rate of 1% or less needs about 300 attacks.",
    "**We wrote 22 of the 42 cases,** knowing which checks existed. That flatters the result.",
    "**Nobody outside the company has relabelled it.** The labels are ours.",
    "**We tuned the checks while looking at half of the alerts.** We scored the other half once, with the checks frozen: 3 of 6 attacks flagged and 5 of 9 harmless cleared. We then fixed two bugs, so the current figures on that half (4 of 6 and 6 of 9) are no longer a clean test.",
    "**It covers Windows events only.** It says nothing about Okta, AWS, Google Cloud or Linux alerts.",
    "**The recordings are small and from 2020.** Each has between 68 and 122 events.",
    "**One computer, two small models.** Results with other models or hardware will differ.",
    "**It does not test the reputation lookups or analyst history,** because a new customer has neither.",
    "**It shows the checks work on these patterns.** It does not show how Hydra will do on your alerts.",
  ]),

  ("h2", "What we will do next"),
  ("ol", [
    "Build a test of about 300 alerts, at least half from real recordings.",
    "Have two people outside the team label every alert without seeing Hydra's answer, and measure how often they agree.",
    "Keep a sealed set that we score once for each major version and then retire.",
    "Run the test on the model we use in production, and publish every result with its margin of error.",
    "Run a shadow evaluation at a customer: Hydra reads real alerts and records what it would conclude, your analysts do their normal work, and we compare. This is the only evidence that really counts.",
  ]),
  ("p", "We will run the test in front of you if you want to see it. [Talk to us](/pages/contact.html)."),
  ("small", "Last reviewed: [[date]] by [[name]]."),
 ]}

ABOUT = {
 "file": "about",
 "title": "About | Hydra",
 "description": "Four people in Accra building an AI analyst for security teams. Who we are, what we believe, and what we have not done yet.",
 "blocks": [
  ("h1", "We are four people from Ghana who think analysts deserve better tools."),
  ("lead", "Hydra is built by Radiant InnovaTech in Accra. Here is who we are, what we believe, and what we have not done yet."),

  ("h2", "Why we are building this"),
  ("p", "We met on a security internship at Telecel Ghana. We saw how much of an analyst's day goes on alerts that turn out to be nothing, and how hard it is to show afterwards why a call was made. We built Hydra to do the first pass and to show its working."),
  ("p", "[[SAMUEL: add two or three sentences in your own words. One specific moment: what you saw, what it cost, what you decided. Do not summarise. Tell one thing that happened.]]"),

  ("h2", "What we believe"),
  ("ul", [
    "**Show the evidence.** A verdict nobody can check is a guess.",
    "**A person decides.** Hydra recommends. People approve.",
    "**Say what is true.** That includes what we have not done yet.",
  ]),

  ("h2", "The founders"),
  ("figure", "[[PHOTO: one real photo of the four of you. Then one portrait each, same crop and same light. Remove this line before publishing.]]",
             "[[Caption: names left to right, and where and when it was taken.]]"),
  ("h3", "Samuel N. K. A. Maclar, co-founder and CEO"),
  ("p", "Cybersecurity, University of Mines and Technology. Full-stack, security and AI engineer. Leads product direction and fundraising, and built the investigation engine and the integrations with the team."),
  ("h3", "Christian Dwamena Agyapong, co-founder and CTO"),
  ("p", "University of Ghana; machine learning certified. Owns the platform architecture, the infrastructure and the AI investigation core."),
  ("h3", "Priscilla Anane, co-founder and CFO"),
  ("p", "Banking and Finance, KNUST, on the investment-banking track, with experience at CAL Asset Management. Owns finance, modelling, runway and fundraising operations."),
  ("h3", "Jojo K. O. Boateng, co-founder and security lead"),
  ("p", "Cybersecurity, University of Mines and Technology. Owns detection logic, threat modelling and the mapping to MITRE ATT&CK."),

  ("h2", "What we have not done yet"),
  ("ul", [
    "We have no customers.",
    "We do not yet have our Cyber Security Authority licence. We are applying, and we will not provide Hydra to a customer until we are licensed or the Authority confirms in writing that we do not need one.",
    "We do not hold ISO 27001 or SOC 2. Both are planned and not started.",
    "Nobody outside the company has tested our accuracy. [Our test results](/pages/our-test-results.html) say exactly what we have measured and what we have not.",
  ]),
  ("p", "We are working on each of these. We will update this list as they change."),

  ("h2", "The company"),
  ("p", "Radiant InnovaTech, Accra, Ghana. [[Add the registered name, registration number and registered address once the company is registered. Until then, do not write \"Limited\".]]"),
  ("cta", "Talk to us", "/pages/contact.html"),
  ("small", "Last reviewed: [[date]] by [[name]]. Each founder has read their own entry."),
 ]}

CONTACT = {
 "file": "talk-to-us",
 "title": "Talk to us | Hydra",
 "description": "Tell us how your security team works today. One of the founders replies within two working days.",
 "blocks": [
  ("h1", "Talk to us"),
  ("lead", "Tell us a little about how your team works today. One of the founders reads every message and replies within two working days. If it helps, we will show you Hydra investigating a test alert, using data from our lab."),
  ("form", "contact-form", [
    ("Your name", "name", "text", True, None),
    ("Work email", "email", "email", True, None),
    ("Organisation", "organisation", "text", True, None),
    ("Your role", "role", "text", True, None),
    ("How does your team monitor today?", "monitoring", "select", False, ["Wazuh", "Splunk", "Microsoft (Defender or Sentinel)", "CrowdStrike", "Another tool", "We do not yet", "Not sure"]),
    ("Anything you want us to know (optional)", "message", "textarea", False, None),
    ("I agree that Radiant InnovaTech may contact me about this request. We use your details only to reply. [Privacy Policy](/pages/privacy.html)", "consent", "checkbox", True, None),
  ], "Send", True),
  ("state", "success", "Thank you. We have your note and will reply by [[day]]. If it is urgent, call [[phone]]."),
  ("state", "error", "That did not send. Please try again, or write to [[email address]]."),

  ("h2", "What happens next"),
  ("ol", [
    "A founder reads your message.",
    "We reply within two working days.",
    "If it fits, we suggest a call of about 30 minutes. You can ask us anything, including the uncomfortable questions.",
  ]),
  ("p", "We will not start with a customer until the Cyber Security Authority has confirmed our licence position in writing. We are glad to talk before then."),

  ("h2", "Other ways to reach us"),
  ("ul", [
    "Security teams: [[name]], [[phone]], [[email address]].",
    "Investors and partners: [[name]], [[email address]].",
    "To report a security problem: [[security email address]]. See our [Security page](/pages/security.html).",
  ]),
  ("small", "Last reviewed: [[date]] by [[name]]."),
 ]}

EARLY = {
 "file": "early-access",
 "title": "Early access | Hydra",
 "description": "We are talking to two to four security teams about a free six-week shadow evaluation of Hydra. Tell us who you are and we will be in touch.",
 "blocks": [
  ("h1", "Be one of our first evaluation partners"),
  ("lead", "We are talking to two to four security teams about a free six-week shadow evaluation. Tell us who you are and we will be in touch."),

  ("h2", "What an evaluation is"),
  ("ul", [
    "Hydra reads your alerts for six weeks and writes down what it would conclude.",
    "It changes nothing in your systems. Your analysts work as normal.",
    "Every week we show you where Hydra and your analysts agreed and where they did not, and why.",
    "At the end you get a written report and decide what to do next.",
    "It is free. If it is useful, we quote in writing afterwards.",
  ]),
  ("p", "We will not start with a team until the Cyber Security Authority has confirmed our licence position in writing, so we cannot give you a start date today. Joining now means we talk to you first."),
  ("link", "How we work with a new team", "/pages/working-with-us.html"),

  ("form", "early-access-form", [
    ("Your name", "name", "text", True, None),
    ("Work email", "email", "email", True, None),
    ("Job title", "title", "text", True, None),
    ("Organisation", "organisation", "text", True, None),
    ("Country", "country", "text", True, None),
    ("What best describes you?", "role_type", "select", True, ["Security analyst", "Security engineer", "Threat hunter", "Head of security or CISO", "Managed security provider", "Other"]),
    ("What would you want Hydra to help with? (optional)", "use_case", "textarea", False, None),
    ("I agree to be contacted about Hydra evaluations. We only email about this. [Privacy Policy](/pages/privacy.html)", "consent", "checkbox", True, None),
  ], "Join the list", True),
  ("state", "success", "Thank you. You are on the list. A founder will write to you at the address you gave."),
  ("state", "error", "That did not send. Please try again, or write to [[email address]]."),

  ("p", "Investors and advisers: please [write to us directly](/pages/contact.html) instead of using this form."),
  ("small", "Last reviewed: [[date]] by [[name]]."),
 ]}
