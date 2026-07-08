// ─── Career Mode: DME 1115 ───────────────────────────────────────────────────
// Built from REAL papers fed to the system: the 2023 end-of-year exam
// (DME 1115, School of Medicine/Nursing/Health Sciences), the 2022 test and
// the 2021/22 sample questions (School of Natural Sciences, Dept. of Medical
// Science). Questions marked source: "past-paper" appear verbatim (or lightly
// cleaned) from those papers with a sourceRef; "exam-style" questions match
// their pattern for parts the papers under-cover. Topic weights follow the
// 2023 final's actual question distribution.

import type { CareerCourse, CareerQuestion } from "./career";

const mcq = (id: string, prompt: string, options: string[], answerIndex: number, explanation: string, source: CareerQuestion["source"] = "exam-style", sourceRef?: string): CareerQuestion =>
  ({ id, kind: "mcq", prompt, options, answerIndex, explanation, source, sourceRef });
const tf = (id: string, prompt: string, answer: boolean, explanation: string, source: CareerQuestion["source"] = "exam-style", sourceRef?: string): CareerQuestion =>
  ({ id, kind: "truefalse", prompt, options: ["True", "False"], answerIndex: answer ? 0 : 1, explanation, source, sourceRef });
const fill = (id: string, prompt: string, answers: string[], explanation: string, source: CareerQuestion["source"] = "exam-style", sourceRef?: string): CareerQuestion =>
  ({ id, kind: "fill", prompt, answerText: answers, explanation, source, sourceRef });

export const DME1115_CAREER: CareerCourse = {
  id: "career_dme1115",
  code: "DME 1115",
  title: "Communication, Professionalism & Student Support",
  emoji: "🩺",
  intro: "The health-stream first-year course, structured from its real past papers: the 2023 final, the 2022 test and the official sample questions.",
  topics: [
    {
      id: "comm",
      title: "Communication Fundamentals",
      emoji: "💬",
      whyLine: "The core of the course — the sample paper opens with ten straight questions on the communication process.",
      examWeight: 4,
      prereqs: [],
      teach: [
        {
          heading: "The communication process",
          body: "Communication moves a message from a sender through a channel to a receiver, who returns feedback. At every stage, interference — a barrier — can distort the message: noise, fatigue, language, culture, or poor listening. Nurses' and patients' knowledge of communication skills reduces barriers; tiredness on either side raises them.",
          check: mcq("dc_c1", "The person who transmits the message is called the ______.", ["Channel", "Sender", "Receiver", "Response"], 1, "The sender originates and transmits; the receiver decodes and feeds back.", "past-paper", "Sample 2021/22 Q2"),
        },
        {
          heading: "Verbal and non-verbal communication",
          body: "Words are only part of the message. Non-verbal communication — everything without words — includes gestures, body language, posture, touch (haptics) and prosody: the pitch, loudness, duration, intonation and tempo of the voice. Skilled clinicians read and control both.",
          check: mcq("dc_c2", "______ refers to pitch, loudness, duration, intonation and tempo.", ["Touches", "Prosody", "Gestures", "Haptics"], 1, "Prosody is the vocal (paralinguistic) layer of speech.", "past-paper", "Sample 2021/22 Q10"),
        },
        {
          heading: "Communication in care: therapeutic and cross-cultural",
          body: "Therapeutic communication is directed at the patient to identify their current health problems, then plan, implement and evaluate the action taken. Cross-cultural communication respects customs, values and illness beliefs; refusing to accept another cultural view is ethnocentrism. The principles ('7 Cs') include completeness — giving all facts the patient needs — plus clarity, conciseness and concreteness.",
          check: mcq("dc_c3", "Inability to accept another cultural view is referred to as:", ["Discrimination", "Stereotyping", "Ethnocentrism", "Stigma"], 2, "Ethnocentrism judges other cultures by the standards of one's own.", "past-paper", "2023 Final Q14"),
        },
      ],
      drill: [
        mcq("dc_d1", "______ means communication without words.", ["Object communication", "Written communication", "Oral communication", "Non-verbal communication"], 3, "Non-verbal covers gesture, posture, touch, prosody — every wordless signal.", "past-paper", "Sample 2021/22 Q1"),
        mcq("dc_d2", "At each stage of communication there may be interference that hinders the process. Such interference is known as a ______.", ["Sender", "Receiver", "Barrier", "Feedback"], 2, "Barriers (noise) can occur at any stage of the process.", "past-paper", "Sample 2021/22 Q4"),
        mcq("dc_d3", "A ______ connects the sender to the receiver.", ["Channel", "Noise", "Communication", "Feedback"], 0, "The channel is the medium carrying the message.", "past-paper", "Sample 2021/22 Q7"),
        mcq("dc_d4", "Communication directed towards the patient to identify current health problems, plan, implement and evaluate the action taken is:", ["Therapeutic communication", "Cross-cultural communication", "Facilitating communication", "Evaluation communication"], 0, "That is the definition of therapeutic communication.", "past-paper", "2023 Final Q12"),
      ],
      moveTest: [
        mcq("dc_m1", "A message should include all the facts the patient needs for the desired reaction. This principle is:", ["Conciseness", "Completeness", "Concreteness", "Clarity"], 1, "Completeness — all needed facts present.", "past-paper", "2023 Final Q15"),
        mcq("dc_m2", "Which of the following is a barrier to nurse–patient communication?", ["The nurse's knowledge of communication skills", "The patient being tired", "The patient's knowledge of communication skills", "Clear feedback"], 1, "Fatigue on either side is a barrier; communication knowledge reduces barriers.", "past-paper", "2023 Final Q11 (adapted)"),
        fill("dc_m3", "The information returned from the receiver to the sender is called ______.", ["feedback"], "Feedback closes the communication loop."),
      ],
    },
    {
      id: "ict",
      title: "Computers & ICT",
      emoji: "💻",
      whyLine: "The 2023 final opened with ten straight ICT questions — hardware, software, malware and health information systems.",
      examWeight: 4,
      prereqs: [],
      teach: [
        {
          heading: "Hardware, software and data",
          body: "A computer takes input, processes it, and outputs or stores it. Software splits into two major categories: system software (the operating system, which the computer cannot work without) and application software (Word, browsers, health information systems). The text you type into an application is data; processed, meaningful data becomes information.",
          check: mcq("di_c1", "Which are the two major categories of software?", ["Drivers and application software", "System and application software", "Operating system and driver software", "System and mobile software"], 1, "System software runs the machine; application software does user tasks.", "past-paper", "2023 Final Q1"),
        },
        {
          heading: "Malware and open source",
          body: "Malware types differ by behaviour: a worm spreads itself across networks, while a Trojan horse is malicious code disguised as a useful program — games and fake 'PC cleaners' are classic Trojans. Open-source software is software whose source code is freely available to anyone; Linux is the standard example.",
          check: mcq("di_c2", "A clinic assistant installed games and supposed 'PC cleaning' programs and her computer slowed down. Such useful-looking programs put her at risk of a:", ["Worm", "Trojan horse", "Email virus", "Boot virus"], 1, "A Trojan masquerades as legitimate software.", "past-paper", "2023 Final Q5"),
        },
      ],
      drill: [
        mcq("di_d1", "Which statement about open-source software is true?", ["It is any software freely downloadable on the internet", "It is software written in a very common language", "It is software whose source code is freely available to anyone", "It is software whose setup is freely available to anyone"], 2, "Open source = the source code itself is open, not merely free downloads.", "past-paper", "2023 Final Q6"),
        mcq("di_d2", "When you type a letter in a word processor, the text you type is treated by the computer as:", ["Information", "Data", "Instructions", "All of the above"], 1, "Raw input is data; it becomes information once processed into meaning.", "past-paper", "2023 Final Q9"),
        mcq("di_d3", "Which of the following statements is true?", ["A computer cannot work without application software", "A computer cannot work without system software", "A computer cannot work without drivers", "A computer cannot work without mobile software"], 1, "No system software (OS) → no working computer.", "past-paper", "2023 Final Q10"),
        mcq("di_d4", "How many bytes encode one character in Unicode and ANSI (ASCII) respectively?", ["Unicode 16, ANSI 8", "Unicode 8, ANSI 16", "Unicode 2, ANSI 1", "Unicode 1, ANSI 2"], 2, "Classic Unicode uses 2 bytes per character; ANSI/ASCII uses 1.", "past-paper", "2023 Final Q3"),
      ],
      moveTest: [
        mcq("di_m1", "A clinic's patient-records application has become very slow. Which three components involved in processing should be considered for upgrade?", ["Hard drive, CPU, RAM", "Flash drive, CPU, RAM", "Hard drive, CPU, ROM", "Internet, CPU, RAM"], 0, "Storage, processor and memory drive processing performance.", "past-paper", "2023 Final Q4"),
        mcq("di_m2", "The Linux operating system is an example of:", ["A network", "Open-source software", "A local area network", "Application software"], 1, "Linux's source is open — the canonical example.", "past-paper", "2023 Final Q7 (adapted)"),
        tf("di_m3", "Reduction in costs and increase in speed are adverse impacts of ICT on communication.", false, "They are benefits of ICT, not adverse impacts.", "past-paper", "2023 Final Section B Q6"),
      ],
    },
    {
      id: "listening",
      title: "Listening Skills",
      emoji: "👂",
      whyLine: "A guaranteed cluster in both the 2022 test and the 2023 final — stages, types and deterrents of listening.",
      examWeight: 3,
      prereqs: ["comm"],
      teach: [
        {
          heading: "The listening process",
          body: "Listening is a process, not a reflex. It begins with receiving the sounds, then interpreting (attaching meaning), evaluating, responding, and remembering. Hearing is passive; listening is active work.",
          check: mcq("dl_c1", "Which of these is the first step in the listening process?", ["Responding", "Receiving", "Stop talking", "Interpreting"], 1, "You must receive the message before you can interpret or respond.", "past-paper", "2022 Test Q2"),
        },
        {
          heading: "Types of listening — and what blocks them",
          body: "Superficial listening lacks depth; appreciative listening is for enjoyment; focused and evaluative listening analyse content; empathetic listening — feeling with the speaker — is what skilled listeners practise. Deterrents to listening include lack of interest, ego and fear. Confidence is not a deterrent.",
          check: mcq("dl_c2", "Which type of listening is followed by skilled listeners?", ["Focused listening", "Attentive listening", "Evaluative listening", "Empathetic listening"], 3, "Skilled (especially clinical) listeners listen empathetically.", "past-paper", "2023 Final Q24"),
        },
      ],
      drill: [
        mcq("dl_d1", "Which of these types of listening lacks depth?", ["Appreciative listening", "Superficial listening", "Focused listening", "Evaluative listening"], 1, "Superficial listening skates across the surface of the message.", "past-paper", "2023 Final Q23"),
        mcq("dl_d2", "Which of these is NOT a deterrent to the listening process?", ["Lack of interest", "Ego", "Confidence", "Fear"], 2, "Confidence helps listening; the others block it.", "past-paper", "2023 Final Q22"),
        fill("dl_d3", "In empathetic listening, the main aim is to understand the speaker's ______ (feelings/point of view).", ["feelings", "emotions", "point of view", "perspective"], "Empathetic listening centres the speaker's feelings and perspective."),
      ],
      moveTest: [
        mcq("dl_m1", "Dialogic listening is also known as ______ listening.", ["Therapeutic", "Appreciative", "Relational", "Evaluative"], 2, "Dialogic = relational listening — meaning emerges through the exchange.", "past-paper", "Sample 2021/22 Q12"),
        mcq("dl_m2", "The correct order of the listening process is:", ["Receiving → interpreting → evaluating → responding", "Responding → receiving → evaluating → interpreting", "Interpreting → receiving → responding → evaluating", "Evaluating → interpreting → receiving → responding"], 0, "Receive first, then make meaning, judge, and respond."),
        tf("dl_m3", "Hearing and listening are the same mental process.", false, "Hearing is passive perception; listening is active processing."),
      ],
    },
    {
      id: "reading",
      title: "Reading & Study Skills",
      emoji: "📖",
      whyLine: "Skimming vs scanning and SQ3R show up every year — quick marks if the definitions are cold.",
      examWeight: 3,
      prereqs: ["comm"],
      teach: [
        {
          heading: "Skimming, scanning and detailed reading",
          body: "Skimming is looking quickly over a text for a general, superficial idea — headings, bold words and pictures, skipping the details. Scanning is hunting for one specific piece of information, like checking whether a job advert is relevant to you. Detailed (intensive) reading is slow and thorough, for study material.",
          check: mcq("dr_c1", "You have to find out if a job advert is relevant to you. Which reading technique do you use?", ["Skimming", "Scanning", "Detailed", "Survey"], 1, "You scan for the specific detail that decides relevance.", "past-paper", "2023 Final Q19"),
        },
        {
          heading: "SQ3R and managing your study time",
          body: "SQ3R structures study reading: Survey the chapter, raise Questions, then Read, Recite and Review. It forces active engagement instead of passive rereading. Pair it with time management — planned study blocks and priorities — the support skills this course exists to build.",
          check: mcq("dr_c2", "The second step in SQ3R is:", ["Survey", "Question", "Read", "Review"], 1, "Survey → Question → Read → Recite → Review.", "past-paper", "Sample 2021/22 Q15"),
        },
      ],
      drill: [
        mcq("dr_d1", "You have to read a leaflet handed to you in the street. Which technique do you use?", ["Skimming", "Scanning", "Detailed", "Intensive"], 0, "A quick general idea is all a street leaflet needs.", "past-paper", "2023 Final Q17"),
        mcq("dr_d2", "What do you skip while skimming?", ["Details", "Bold words", "Headings", "Graphs or pictures"], 0, "Skimming keeps the signposts and skips the fine detail.", "past-paper", "2023 Final Q18"),
        fill("dr_d3", "In the SQ3R study-reading strategy, the 'S' stands for ______.", ["survey"], "Survey the material first for its structure.", "past-paper", "2023 Final Q53 (adapted)"),
      ],
      moveTest: [
        mcq("dr_m1", "______ means looking quickly over a textbook to get a general, superficial idea of the content.", ["Scanning", "Extensive reading", "Skimming", "Intensive reading"], 2, "That is skimming, by definition.", "past-paper", "Sample 2021/22 Q13"),
        mcq("dr_m2", "If a student does not understand what they read, what should they do?", ["Skip it", "Ask the teacher", "Reread it", "Recall it"], 2, "First remedy: reread — then seek help if it still won't yield.", "past-paper", "2023 Final Q20"),
        tf("dr_m3", "Using abbreviations and symbols is not appropriate during note-taking.", false, "Abbreviations and symbols are exactly what good note-taking uses.", "past-paper", "2023 Final Section B Q8"),
      ],
    },
    {
      id: "writing",
      title: "Academic Writing",
      emoji: "✍️",
      whyLine: "The heavyweight: nearly half of the 2023 final — sentences, paraphrasing, essays, referencing and reports.",
      examWeight: 5,
      prereqs: ["reading"],
      teach: [
        {
          heading: "Sentences and clauses",
          body: "A simple sentence has one independent clause. A compound sentence joins two independent clauses ('Bwalya went to school but refused to attend any classes'). A complex sentence pairs a main clause with a subordinate clause — 'After this intensive academic session' cannot stand alone; it is subordinate.",
          check: mcq("dw_c1", "'Bwalya went to school but refused to attend any classes' is an example of:", ["A complex-compound sentence", "A complex sentence", "A compound sentence", "A simple sentence"], 2, "Two independent clauses joined by 'but' → compound.", "past-paper", "2022 Test Q1"),
        },
        {
          heading: "Paraphrase, summary and the writing process",
          body: "A paraphrase uses other words to retain the original meaning at similar length; a summary condenses the main ideas in your own words. The composing stage runs: narrow the topic, develop a thesis, conduct research, organize ideas, write the first draft — then revise, and finally edit ('make it correct').",
          check: mcq("dw_c2", "Which statement about paraphrasing is true?", ["It retains the original words with a different meaning", "It uses other words to retain the original meaning", "It reduces the word length", "It should be conclusive"], 1, "Same meaning, different words — that is a paraphrase.", "past-paper", "2023 Final Q31"),
        },
        {
          heading: "Referencing and reports",
          body: "Academic writing combines diverse, credible sources and credits them. Harvard in-text citations give the author's surname and year of publication. Formal reports carry standard parts — and the alphabetical list of technical terms with definitions is the glossary.",
          check: fill("dw_c3", "A Harvard in-text citation includes the author's surname and the ______ of publication.", ["year", "date"], "Harvard style: (Surname, Year).", "past-paper", "2023 Final Q57 (adapted)"),
        },
      ],
      drill: [
        mcq("dw_d1", "'I am eager to go home after this intensive academic session.' — 'After this intensive academic session' is:", ["A noun clause", "A main clause", "An independent clause", "A subordinate clause"], 3, "It cannot stand alone — a subordinate element.", "past-paper", "2023 Final Q29"),
        mcq("dw_d2", "'Immediately I saw the exam papers, my heart started beating wildly.' This is an example of:", ["A complex sentence", "A simple sentence", "A complex-compound sentence", "A compound sentence"], 0, "A subordinate clause plus a main clause → complex.", "past-paper", "2023 Final Q32"),
        mcq("dw_d3", "One difference between summarizing and paraphrasing is:", ["Paraphrasing condenses ideas while summarizing shortens them", "Paraphrasing captures main ideas while summarizing condenses them", "Summarizing captures the main ideas while paraphrasing captures the original meaning in your own words", "There is no difference"], 2, "Summary condenses main ideas; paraphrase restates full meaning.", "past-paper", "2023 Final Q33"),
        fill("dw_d4", "The alphabetical arrangement of technical terms with definitions in a report is known as the ______.", ["glossary"], "The glossary defines a report's technical vocabulary.", "past-paper", "2023 Final Q64 (adapted)"),
      ],
      moveTest: [
        mcq("dw_m1", "The step of the writing process categorized as 'make it correct' is:", ["Composing", "Revising", "Editing", "Publishing"], 2, "Editing polishes grammar, spelling and punctuation — correctness.", "past-paper", "2023 Final Q42 (adapted)"),
        mcq("dw_m2", "Which is true about academic writing?", ["It combines diverse views", "It only uses websites", "It ignores what others know about the topic", "It is defined by being time-consuming"], 0, "Academic writing synthesises credible, diverse sources.", "past-paper", "2023 Final Q27"),
        tf("dw_m3", "Job application letters are an example of academic written documents.", false, "They are professional/business documents, not academic writing.", "past-paper", "2023 Final Section B Q7"),
      ],
    },
    {
      id: "ethics",
      title: "Professionalism & Ethics",
      emoji: "⚖️",
      whyLine: "Etiquette vs ethics, consent and confidentiality — the final tests these in both the MCQs and the true/false section.",
      examWeight: 3,
      prereqs: ["comm"],
      teach: [
        {
          heading: "Etiquette and ethics",
          body: "Etiquette is the set of rules guiding courteous conduct in a profession — manners. Ethics are the moral principles guiding decisions; healthcare ethics are the principles that guide health professionals as they provide principled care. Etiquette makes you polite; ethics make you right.",
          check: mcq("de_c1", "The rules that guide the courteous conduct of an individual in a profession refer to:", ["Ethics", "Etiquette", "Virtue ethics", "Legislation"], 1, "Courteous conduct = etiquette; moral principles = ethics.", "past-paper", "2023 Final Q25"),
        },
        {
          heading: "Consent, influence and confidentiality",
          body: "Valid consent needs competence — the patient's ability to understand the information and the consequences of decisions. Influence has grades: persuasion (legitimate argument), manipulation (distorting information), and coercion (explicit or implicit threats). Confidentiality is a duty, but it is not absolute — it may be breached in narrow, justified circumstances such as risk of serious harm.",
          check: tf("de_c2", "Confidentiality is not absolute and may be breached.", true, "In narrow, justified cases (e.g. protecting others from serious harm).", "past-paper", "2023 Final Section B Q5"),
        },
      ],
      drill: [
        mcq("de_d1", "The moral principles that guide health professionals as they provide the best principled care are:", ["Etiquette", "Ethics", "Healthcare ethics", "Ethical values"], 2, "Healthcare ethics — the profession-specific moral principles.", "past-paper", "2023 Final Q26"),
        tf("de_d2", "Manipulation is the use of explicit or implicit threat to ensure treatment.", false, "Threats are coercion; manipulation distorts information or framing.", "past-paper", "2023 Final Section B Q4"),
        tf("de_d3", "Competence refers to the patient's ability to misunderstand the information provided by clinicians.", false, "Competence is the ability to UNDERSTAND the information and consequences.", "past-paper", "2023 Final Section B Q3"),
      ],
      moveTest: [
        mcq("de_m1", "A clinician who explains the evidence and reasons for a treatment, leaving the patient free to decide, is using:", ["Coercion", "Manipulation", "Persuasion", "Paternalism"], 2, "Persuasion by legitimate argument respects autonomy."),
        tf("de_m2", "Phronesis does not accept a rigid application of rules.", true, "Phronesis (practical wisdom) applies judgement case by case.", "past-paper", "2023 Final Section B Q2"),
        fill("de_m3", "The use of explicit or implicit threats to ensure treatment is called ______.", ["coercion"], "Coercion removes free choice through threat."),
      ],
    },
  ],
};
