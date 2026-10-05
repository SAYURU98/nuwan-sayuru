
/* ===== Site configuration ===== */
window.SITE = Object.assign({
  web3formsKey: "6a689e70-1d05-4178-a6da-f70e0795667d",            // free key from web3forms.com: delivers contact-form mail to your inbox
  whatsapp: "94767450014",
  email: "nuwan.sayuru19@gmail.com",
  phone: "+94 76 745 0014",
  github: "SAYURU98",
  linkedin: "https://www.linkedin.com/in/nuwan-sayuru-86907720a"
}, window.SITE || {});
/* ===== Default content. The live site overrides it from the database (admin page or the weekly LinkedIn sync). ===== */
window.CONTENT_DEFAULT = {
  role: "Field Services Engineer, Huawei Technologies Lanka",
  intro: "I implement, prove and support enterprise infrastructure: data centre, storage, SD-WAN, campus networks, GPON, collaboration and surveillance.",
  basedIn: "Based in Colombo. Implementation, POCs, troubleshooting and after-sales support across Sri Lanka and the Maldives.",
  available: true,
  hud: [
    {t:"Open to new roles · relocation-ready on one month's notice", c:"#f2a93b"},
    {t:"Solution consulting and freelance", c:"#cfcac2"},
    {t:"Open to collaborations", c:"#8f8a84"}
  ],
  wwmIntro: "Three ways to work together.",
  wwm: [
    {t:"Hire me", c:"linear-gradient(90deg,#f2a93b,transparent)", d:"Presales or post-sales engineering in network, data centre and storage. I can relocate and start within one month.", cta:"Discuss a role", kind:"Job opportunity"},
    {t:"Consulting and freelance", c:"linear-gradient(90deg,#f2a93b,transparent)", d:"Solution design reviews, implementation support, proofs of concept and troubleshooting on enterprise network, storage and data centre platforms.", cta:"Ask about a project", kind:"Consultation"},
    {t:"Security services", c:"linear-gradient(90deg,#f2a93b,transparent)", tag:"On request", d:"Network security reviews, firewall and access-control hardening, and vulnerability assessments, drawing on my cyber security degree.", cta:"Start a conversation", kind:"Consultation"}
  ],
  photo: {url:"", updated:""},
  cv: {url:"/cv", updated:"5 October 2026"},
  stats: [
    {v:"106+", l:"proofs of concept"},
    {v:"175+", l:"deployments"},
    {v:"5+", l:"after-sales cases a day"},
    {v:"12k+", l:"users on one managed Wi-Fi platform"},
    {v:"250+", l:"branches on one SD-WAN"},
    {v:"300+ PB", l:"object storage across two sites"}
  ],
  statsNote: "LinkedIn figures to January 2026, plus my own work log since.",
  services: [
    {t:"Implementation and delivery", d:"Installation, configuration, commissioning and handover against the agreed design."},
    {t:"Proofs of concept", d:"Building the lab, running the test cases and showing the result to the customer."},
    {t:"After-sales support", d:"Owning cases after go-live, with RCA and escalation to TAC, GSC and R&D when needed."},
    {t:"L1 troubleshooting", d:"First-line fault isolation across network, compute and storage."},
    {t:"Maintenance support", d:"Upgrades, patches, part replacements and health checks under change control."},
    {t:"Documentation", d:"LLDs, RFCs, MOPs, SoWs, UAT plans and RCA reports."}
  ],
  domains: [
    {t:"Data centre", c:["#f2a93b","#f4f2ee"], d:"Virtualisation, disaster recovery and backup on Huawei DCS, including live migration from legacy and physical workloads.", k:["FusionCompute","eDME","UltraVR","eBackup","FusionCube"]},
    {t:"Storage", c:["#f2a93b","#f4f2ee"], d:"SAN and NAS, all-flash arrays, distributed object storage and immutable backup appliances.", k:["OceanStor Dorado","OceanStor Pacific","OceanProtect","SAN / NAS"]},
    {t:"SD-WAN and CloudCampus", c:["#f2a93b","#f4f2ee"], d:"Routers, switches, WLAN, firewalls and WAN acceleration, managed from one controller.", k:["iMaster NCE-Campus","AR routers","CloudEngine","AirEngine","HiSecEngine"]},
    {t:"GPON", c:["#f2a93b","#f4f2ee"], d:"Passive optical LAN from OLT to ONT, monitored centrally.", k:["OLT","ONT","eSight"]},
    {t:"Collaboration", c:["#f2a93b","#f4f2ee"], d:"Meeting rooms and classrooms on Huawei collaboration platforms.", k:["IdeaHub","Smart Classroom","SMC"]},
    {t:"Surveillance", c:["#f2a93b","#f4f2ee"], d:"Video surveillance for ports, logistics, and oil and gas sites.", k:["IVS3800"]}
  ],
  highlights: [
    {n:"1st", t:"First Huawei SD-WAN in Sri Lanka", s:"Financial sector, ISP-managed model, 62 to 250+ branches", b:"Migrated MPLS branches to multi-link SD-WAN with zero-touch provisioning, SLA probes, application-based routing, QoS, IPSec, dual-gateway HA, BGP EVPN, VRRP, and AV/IPS firewalling. Failover got faster and new branches became simpler to bring online."},
    {n:"2nd", t:"SD-WAN for a major government agency", s:"Head office and branches over MPLS and Internet", b:"Low-level design, head-office and controller deployment, then branch-by-branch cutover and testing against the customer's requirements, all managed from iMaster NCE-Campus."},
    {n:"12k", t:"Multi-tenant managed Wi-Fi", s:"12,000+ users, 5,000+ devices, 400+ tenants", b:"Deployed CloudCampus on an ISP's private cloud. Configured APs, tenants and onboarding, and added batch, ZTP and feature templates so the service could scale with SLA assurance."},
    {n:"300", t:"Enterprise WLAN", s:"5 to 300 APs per site", b:"Universities, banks and enterprises. 802.1X, MAC bypass, portals and guest codes, with RF, roaming and mesh tuning and CampusInsight analytics."},
    {n:"1k", t:"DCS and storage", s:"10-node clusters, 1,000 vCPUs, 300+ VMs", b:"For finance, government, defence and education customers, with UltraVR, eBackup, OceanStor SAN/NAS and Pacific, and live migration from legacy and physical workloads."},
    {n:"PB", t:"Distributed object storage", s:"300+ PB across a primary and a DR site", b:"Installation, S3 namespaces and accounts, replication between sites and failover testing for a telecom operator."},
    {n:"A/V", t:"Collaboration and surveillance", s:"IdeaHub, Smart Classroom, IVS3800", b:"Supported collaboration rooms and classroom systems, and IVS3800 video surveillance for ports, logistics, and oil and gas."}
  ],
  sectors: ["Finance","ISP and telecom","Education","Government","Defence","Hospitality","Logistics","Enterprise"],
  experience: [
    {when:"Feb 2024 to now", t:"Field Services Engineer", o:"Huawei Technologies Lanka", d:"Promoted from intern. Delivery and support across data centre, storage, SD-WAN, campus, GPON, collaboration and surveillance."},
    {when:"May 2023 to Feb 2024", t:"Internship Trainee", o:"Huawei Technologies Lanka", d:"Enterprise Business Group."},
    {when:"2024", t:"BSc (Hons) Information Technology, Cyber Security", o:"Sri Lanka Institute of Information Technology (SLIIT)", d:""}
  ],
  credentials: [
    {big:"National Champion", sm:"Huawei ICT Competition 2022/23", d:"Network Track winner in Sri Lanka. Represented the country at the regional round in Indonesia.", star:true},
    {big:"OceanStor Dorado", sm:"Huawei Global Training Center, Jul 2024", d:"Storage Administrator. Credential ID HUC24EITSLSIC001000010."},
    {big:"Published research", sm:"ResearchGate, 2022", d:"Peer-reviewed paper on healthcare IoT security."}
  ],
  repos: ["PishCatcher","SSS_Project_God-s-EYE","God-s-EYE","securepy","Multi-Factor-Authentication-Report","TeamsProWeb"]
};
/* GitHub snapshot, used when the live API can't be reached */
window.REPO_SNAPSHOT = [
  {name:"PishCatcher", description:"Intelligent Chrome extension for phishing detection using deep learning", language:"Jupyter Notebook"},
  {name:"SSS_Project_God-s-EYE", description:"Intelligent malware detection web UI using machine learning", language:"Jupyter Notebook"},
  {name:"God-s-EYE", description:"An intelligent phishing detector Chrome extension using machine learning", language:"Jupyter Notebook"},
  {name:"securepy", description:"VS Code extension that uses the Bandit static analysis library to find and fix security issues in Python projects", language:"", license:"Apache-2.0"},
  {name:"Multi-Factor-Authentication-Report", description:"", language:""},
  {name:"TeamsProWeb", description:"", language:"JavaScript"}
];
