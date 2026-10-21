# The privacy notice and the terms of use. Same block syntax as pages.py.
# ANALYTICS_ON is set by build_site.py. A draft for a Ghanaian lawyer to review: do not remove the
# LEGAL-REVIEW-PENDING marker (legal_review) until they have.

def privacy(analytics_on):
    cookies = ("This website sets no cookies. Hydra's sign-in uses the essential cookies of our sign-in provider, so you stay signed in and are protected against attacks. We use no advertising trackers anywhere, and no analytics or session recording inside Hydra, because its screens show our customers' confidential security information.")
    if analytics_on:
        cookies += (" On this website we count visits with Matomo, which we host ourselves. It sets no cookies, keeps IP addresses short and does not follow you across other sites. It respects your browser's Do Not Track setting.")
    else:
        cookies += (" We plan to add website analytics that we host ourselves and that works without cookies. We will update this notice before we turn it on.")
    return {"file": "pages/privacy.html", "path": "/pages/privacy.html",
 "title": "Privacy notice | Hydra",
 "description": "What personal data Radiant InnovaTech collects through this website and through Hydra, why, who sees it, how long we keep it, and your rights.",
 "legal_review": True,
 "blocks": [
  ("h1", "Privacy notice"),
  ("lead", "This notice explains what personal data Radiant InnovaTech collects, why, who sees it, how long we keep it, and what rights you have under Ghana's Data Protection Act, 2012 (Act 843). It covers this website and, once your organisation gives you an account, Hydra itself."),
  ("small", "Effective 21 October 2026. Version 1.0."),

  ("h2", "1. Who we are"),
  ("p", "Radiant InnovaTech makes Hydra, software that investigates security alerts. We are based in Accra, Ghana. Company registration is in progress, and we will add the registered name, number and address here once we have them. You can reach us about privacy at privacy@radiantinnovatech.com."),
  ("p", "For the data in section 2 we decide how it is used, so we are the data controller. For the security alerts an organisation sends into Hydra (section 4), that organisation decides how the data is used and we process it for them, so they are the controller and we are the processor. Hydra is in our lab today and has no customers yet."),
  ("p", "**Registration.** We are not yet registered with Ghana's Data Protection Commission as a data controller. Until we are, the forms on this website are switched off, so this website collects only the technical data described in section 2. If you write or call us, we use what you send only to reply."),

  ("h2", "2. What we collect, why and for how long"),
  ("p", "We collect only what we need. We rely on one or more of these grounds: you have consented, we need the data for a contract with you or your organisation, the law requires it, or we have a legitimate interest that does not override your rights (for example keeping this website secure)."),
  ("table", [["Who", "What we collect", "Why", "Ground", "How long"],
             ["People who visit this website", "IP address, browser and device type, the page you asked for, the time and the page you came from, recorded in our server logs.", "To run the website and keep it secure.", "Legitimate interest (security)", "Up to 30 days."],
             ["People who write to us or call us", "Your name, contact details and what you tell us.", "To reply, and to arrange a conversation if you want one.", "Consent; legitimate interest in replying", "Up to 12 months after your message, then deleted."],
             ["People who use our forms, once they are switched on", "Name, work email, organisation, role, how your team monitors alerts or your country, your message and your consent. We also keep your IP address with the submission to limit abuse.", "To reply to your request and to decide whom to invite to an evaluation.", "Consent", "12 months after you send it. A nightly job deletes older entries."],
             ["Hydra users (an organisation's staff)", "Name, work email, role, sign-in details such as time, IP address and device, your actions and decisions in Hydra, feedback on verdicts, and support messages.", "To provide Hydra to your organisation, keep it secure and give support.", "Contract with your organisation; legitimate interest (security)", "While the account is active and for up to 12 months after. The audit trail as the customer's agreement says."],
             ["Customers, prospects and partners", "Name, role, work email and phone, contracts, invoices, payment records and our messages.", "To make and perform agreements, bill and manage the relationship.", "Contract; legal obligation; legitimate interest", "As long as the relationship lasts, then as long as tax and accounting law require."],
             ["People who apply to work with us", "CV, contact details and what you tell us.", "To consider your application.", "Consent", "Up to 12 months after the decision, unless you agree to longer."]]),
  ("p", "Giving us your details is voluntary, but if you do not give what we need to reply or to create an account, we cannot provide that service. We do not knowingly collect special personal data (such as health, religion, ethnic origin or criminal conduct) or the data of children, and we ask you not to send it to us."),

  ("h2", "3. Where we get the data"),
  ("p", "Mostly from you: when you visit this website, write to us or use Hydra. We also receive your name and work email from the organisation that gave you a Hydra account. We may receive business contact details from public sources such as your organisation's website, and from partners, investors or programmes that introduce us to you. We tell you about that when we first contact you."),

  ("h2", "4. Security alerts sent to Hydra by organisations"),
  ("p", "When an organisation connects its security tools to Hydra, Hydra receives alerts that may contain personal data, such as user names, device names, email addresses and IP addresses of that organisation's staff and other people. We use this data only to provide Hydra to that organisation, on its instructions, under a data processing agreement. We do not use it for our own purposes, we do not train AI models on it, and we do not sell it."),
  ("p", "If you think your data is in an alert, ask your employer or the organisation that runs the security tool, because it controls that data. If you contact us, we will pass your request to them."),

  ("h2", "5. How Hydra uses artificial intelligence"),
  ("p", "Hydra uses AI models to read alert text, explain what may have happened and suggest what a person should do. Depending on the customer's choice, the model is either a hosted service from a third party (at present Google's Vertex AI) or a model we run ourselves. Hydra is advice-only: it recommends and a person decides. It does not make decisions about individuals by automatic means alone and it does not act on a customer's systems. AI results can be wrong, which is why a person reviews them."),

  ("h2", "6. Who we share data with"),
  ("p", "We do not sell personal data. We share it only with these recipients, and only as far as they need it."),
  ("table", [["Recipient", "What for", "Where"],
             ["Google Cloud (and Google Vertex AI, if a customer chose the hosted model)", "Hosting this website, Hydra, our databases and backups, and running the hosted AI model.", "United States, unless a customer's agreement says otherwise"],
             ["Google Fonts", "Delivering this website's fonts to your browser, so Google receives your IP address when a page loads.", "United States"],
             ["Brevo", "Sending the email that tells us someone has used a form, and our replies.", "European Union"],
             ["Clerk", "Sign-in and account security for Hydra users.", "United States"],
             ["mNotify", "Text-message notifications, if a customer turns them on.", "Ghana"],
             ["Google Workspace", "Our own email and documents.", "United States and elsewhere"],
             ["Our professional advisers, auditors and insurers", "Legal, accounting and insurance advice.", "Ghana and elsewhere"],
             ["Courts, regulators and law enforcement", "When the law requires or allows us to disclose data.", "Ghana"]]),
  ("p", "If we sell or merge the business, we may share data with the other side under a confidentiality agreement, and we will tell you if your data is handled differently afterwards."),

  ("h2", "7. Data sent outside Ghana"),
  ("p", "Some of our providers are outside Ghana, as the table shows. When we send personal data abroad we use written contracts that require the recipient to protect it as this notice and the Act require, and we choose providers with recognised security practices. A customer that needs its data kept in a particular place can ask us, and its agreement with us will say where the data is held."),

  ("h2", "8. How we protect data"),
  ("p", "We use measures that fit the risk. Each customer's data is kept in a separate workspace, access is limited to staff who need it, the services we use encrypt data in transit and at rest, Hydra records what it and its users do in an audit trail, and we keep backups. Our [Security page](/pages/security.html) says in detail what is in place and what is not. No system is perfectly secure. If a breach affects your personal data, we will tell the people affected and the Data Protection Commission as the law requires."),

  ("h2", "9. Cookies and analytics"),
  ("p", cookies),

  ("h2", "10. Marketing"),
  ("p", "We do not send marketing emails today. If we start, we will send them only to people who ask, with an unsubscribe link in every message."),

  ("h2", "11. Your rights"),
  ("p", "Under the Act you can ask us to:"),
  ("ul", [
    "tell you whether we hold personal data about you, describe it and give you a copy (sections 32 and 35);",
    "correct or delete data that is inaccurate, out of date, incomplete, misleading, excessive or unlawfully obtained, or that we no longer need (sections 33 and 44);",
    "stop or not start processing your data where it is causing, or is likely to cause, unwarranted damage or distress (section 39), and object to processing in the other cases the Act allows (section 20(2));",
    "stop using your data for direct marketing (section 40); and",
    "make sure that a decision that significantly affects you is not based only on automatic processing (section 41).",
  ]),
  ("p", "To use a right, write to privacy@radiantinnovatech.com. We may need to check who you are. We will answer in writing within 21 days, and if we cannot do what you ask, we will tell you why. You can also complain to Ghana's Data Protection Commission, and the Act gives you a right to compensation if someone breaks it and you suffer damage (section 43)."),

  ("h2", "12. Changes to this notice"),
  ("p", "We will update this notice when what we do changes and say at the top when it was last updated. If a change is important, we will tell the people affected directly."),

  ("h2", "13. Contact"),
  ("p", "Radiant InnovaTech, Accra, Ghana. Email: privacy@radiantinnovatech.com."),
  ("small", "Last updated: 21 October 2026. Owner: Priscilla Anane. This notice has not yet been reviewed by a Ghanaian lawyer."),
 ]}


TERMS = {"file": "pages/terms.html", "path": "/pages/terms.html",
 "title": "Terms of use | Hydra",
 "description": "The terms for using this website. They do not cover Hydra itself, which is not on sale yet.",
 "legal_review": True,
 "blocks": [
  ("h1", "Terms of use"),
  ("lead", "These terms cover your use of this website. They do not cover Hydra itself. Hydra is not on sale yet, and when it is, it will come with its own agreement."),
  ("small", "Effective 21 October 2026. Version 1.0."),

  ("h2", "1. Who we are"),
  ("p", "This website belongs to Radiant InnovaTech, Accra, Ghana. Company registration is in progress, and we will add the registered name and number to our [Privacy notice](/pages/privacy.html) once we have them."),

  ("h2", "2. Using this website"),
  ("p", "You may read it, link to it and share its pages. Please do not copy the site as a whole, scrape it at volume, try to break into it or overload it, or use it to send us anything unlawful."),

  ("h2", "3. What the site is"),
  ("p", "It describes Hydra and our company. It is information, not an offer to sell, not a promise of any service, and not security, legal or regulatory advice. Hydra is early stage. Where we describe plans, they are plans. Our test results come from our own small test, and the test results page says what it does not show."),

  ("h2", "4. Accuracy"),
  ("p", "We try to keep the site correct, and we say on each page when it was last reviewed. We can still be wrong, and we may change the site without notice. Please check anything that matters with us before you rely on it."),

  ("h2", "5. Our content"),
  ("p", "The text, diagrams, screenshots, name and logo on this site belong to Radiant InnovaTech or are used with permission. You may quote short extracts if you link back to the page you took them from. For anything more, ask us first."),

  ("h2", "6. Links to other sites"),
  ("p", "We link to other websites. We do not control them and we are not responsible for what they say or do."),

  ("h2", "7. Reporting a weakness"),
  ("p", "If you find a weakness in this website, please tell us at security@radiantinnovatech.com. If you act in good faith, avoid harming other people's data, and give us a reasonable time to fix it before you tell anyone else, we will not take action against you. Our [security.txt file](/.well-known/security.txt) has the details."),

  ("h2", "8. Our responsibility"),
  ("p", "We provide this website as it is. We do not promise that it will always be available or free of errors. Nothing in these terms limits any liability that cannot be limited under Ghanaian law."),

  ("h2", "9. Privacy"),
  ("p", "Our [Privacy notice](/pages/privacy.html) explains what we do with personal data."),

  ("h2", "10. Changes and law"),
  ("p", "We may update these terms, and the date below shows the latest version. These terms are governed by the laws of Ghana, and the courts of Ghana have jurisdiction over any dispute about them."),
  ("small", "Last updated: 21 October 2026. Owner: Priscilla Anane. These terms have not yet been reviewed by a Ghanaian lawyer."),
 ]}
