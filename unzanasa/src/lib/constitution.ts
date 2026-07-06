// ─── The UNZANASA Constitution ───────────────────────────────────────────────
// Faithful transcription of the official document ("UNZANASA FINAL
// CONSTITUTION", approved by the Dean of the School of Natural Sciences, the
// UNZANASA President and the Constitution Review). The original PDF ships at
// /documents/UNZANASA-Constitution.pdf — wording below follows it verbatim.

export type ListStyle = "decimal" | "alpha" | "roman";

export interface ListItem {
  text: string;
  sub?: { style: ListStyle; items: ListItem[] };
}

export type Block =
  | { kind: "p"; text: string }
  | { kind: "list"; style: ListStyle; items: ListItem[] };

export interface Article {
  id: string;
  title: string;
  blocks: Block[];
}

export interface Part {
  id: string;
  title: string;
  articles: Article[];
}

const p = (text: string): Block => ({ kind: "p", text });
const list = (style: ListStyle, items: (string | ListItem)[]): Block => ({
  kind: "list",
  style,
  items: items.map((i) => (typeof i === "string" ? { text: i } : i)),
});
const item = (text: string, style: ListStyle, sub: (string | ListItem)[]): ListItem => ({
  text,
  sub: { style, items: sub.map((i) => (typeof i === "string" ? { text: i } : i)) },
});

export const CONSTITUTION_META = {
  title: "UNZANASA Constitution",
  association: "The University of Zambia School of Natural Sciences Student Association (UNZANASA)",
  pdf: "/documents/UNZANASA-Constitution.pdf",
  approvals: [
    { role: "Dean of School of Natural Sciences", name: "Dr. Onesmus Munyati" },
    { role: "President of UNZANASA", name: "Mr. Kasikila Isaac" },
    { role: "Constitution Review — Minister of Justice", name: "Hon. Pelwa Simfukwe" },
  ],
};

export const DEFINITIONS: { term: string; meaning: string }[] = [
  { term: "Academic year", meaning: "The period of the year during which students attend University as established by the University of Zambia Senate." },
  { term: "Association Constitution", meaning: "The constitutions of each independent association of the School of Natural Sciences." },
  { term: "Association", meaning: "The University of Zambia School of Natural Sciences Association, used interchangeably with the acronym “UNZANASA”." },
  { term: "Constitution", meaning: "This Parent body's Constitution of the University of Zambia School of Natural Sciences Association (UNZANASA)." },
  { term: "Financial committee", meaning: "The committee that oversees the expenses of the association." },
  { term: "Judiciary", meaning: "The University of Zambia Students Union judiciary." },
  { term: "Membership", meaning: "Shall be construed with the meaning assigned in Article 3." },
  { term: "Organ(s)", meaning: "The body or bodies that make up the University of Zambia School of Natural Sciences Association (UNZANASA), as fully explained in Article 4." },
  { term: "UNZASU Constitution", meaning: "The University of Zambia Students Union Constitution of 2018." },
  { term: "UNZANASA", meaning: "The University of Zambia School of Natural Sciences Association." },
  { term: "University", meaning: "The University of Zambia, specifically the Great East Road Main Campus." },
  { term: "Ordinary meeting", meaning: "A meeting held by the Executive Committee." },
  { term: "Extraordinary meeting", meaning: "A meeting held with the Executive Committee and the Executive members of Affiliate Associations." },
];

export const CONSTITUTION: Part[] = [
  {
    id: "part-1",
    title: "Part One",
    articles: [
      {
        id: "establishment",
        title: "Establishment and Name",
        blocks: [
          p("There is hereby established an Association to be known as the University of Zambia School of Natural Sciences Association (UNZANASA)."),
        ],
      },
      {
        id: "article-1",
        title: "Article 1: Supremacy of the Constitution",
        blocks: [
          list("decimal", [
            "This Constitution shall be the supreme law of the University of Zambia School of Natural Sciences Association (UNZANASA) which has binding force on all students and leaders under the School.",
            "The Constitutions of all the affiliated Associations under the School of Natural Sciences shall be in line with and/or subject to this Constitution.",
            "Any instrument or custom or practice that is inconsistent with this Constitution shall be null and void.",
            "The above clauses notwithstanding, this Constitution shall be subject to the UNZASU Constitution, the Constitution of Zambia and the Higher Education Act.",
          ]),
        ],
      },
      {
        id: "article-2",
        title: "Article 2: Objectives and Aims",
        blocks: [
          list("decimal", [
            "To encourage the spirit and sense of belonging to the School of Natural Sciences and stimulate sufficient pride in the students and the professions for which they are being prepared.",
            "To promote the general welfare of the students under the School of Natural Sciences.",
            "To promote the academic welfare of students.",
            "To develop and encourage appropriate traditions of social and academic life.",
            "To cultivate a spirit of togetherness between students, the teaching fraternity and non-teaching staff and the community neighbouring colleges and universities.",
            "To create an opportunity for members to develop their talents and qualities.",
            "To uphold and defend the School of Natural Sciences students' interest inside and outside the university campus.",
            "To ensure gender parity in all students affairs.",
            "To realize and promote the welfare of the physically challenged members.",
            "To liaise with other institutes of higher learning to enhance linkages.",
            "To disseminate information and educate its members and the general populous within and outside The University of Zambia about the School of Natural Science programmes in Zambia.",
          ]),
        ],
      },
      {
        id: "article-3",
        title: "Article 3: Membership",
        blocks: [
          list("decimal", [
            item("There shall be two types of membership:", "alpha", [
              "Ordinary or full membership and",
              "Associate membership.",
            ]),
            "Ordinary or full membership shall be compulsory to all students under the School of Natural Sciences and such membership shall be only effective upon full payment of an annual non-refundable membership fee as may be determined from time to time by the Executive Committee in consultation with the matron or patron.",
            "Membership fee for ordinary or full members shall be paid at the beginning of the academic year depending on the jurisdiction of the Executive Committee.",
            "Evidence of subscription to an Association shall be conclusive evidence and a prerequisite for one to be an ordinary or full member of the University of Zambia School of Natural Sciences Association.",
            "Associate membership means associations to affiliate to the University of Zambia School of Natural Sciences Association.",
            "All former students of the School of Natural Sciences shall be members of the UNZANASA alumni and can be called upon from time to time depending on available programs.",
            "Faculty members will also be regarded as members of the association by default.",
            item("Members shall:", "alpha", [
              "Carry out duties as assigned by the Executive Committee.",
              "Effectively participate in functions and activities of the association.",
            ]),
          ]),
        ],
      },
      {
        id: "article-4",
        title: "Article 4: Organs",
        blocks: [
          list("decimal", [
            item("The organs of the Association shall be:", "alpha", [
              "The Executive Committee",
              "General Assembly",
              "Electoral Commission",
              "The Disciplinary Committee",
            ]),
            "The organs of the Association shall perform the functions and act within the limits of the powers conferred upon them by or under this constitution.",
          ]),
        ],
      },
    ],
  },
  {
    id: "part-2",
    title: "Part Two — The General Assembly",
    articles: [
      {
        id: "article-5",
        title: "Article 5: Composition",
        blocks: [
          p("The Composition of the General Assembly shall be made up of the Executive Committee and the representatives of Affiliate Associations (Presidents, Vice Presidents and any other Executive Member)."),
        ],
      },
      {
        id: "article-6",
        title: "Article 6: Functions and Powers",
        blocks: [
          p("The General Assembly shall:"),
          list("decimal", [
            "Be responsible for the general policy and direction of the University of Zambia School of Natural Sciences Association (UNZANASA).",
            item("Have the right to dissolve the executive or remove any member of the executive in special cases involving:", "alpha", [
              "Fraud.",
              "Corruption.",
              "Failure to deliver due to physical or mental illness as certified by a qualified medical practitioner.",
              "Inconsistencies that may be deemed a threat to and/or retrogressive to the sole purpose of the Association with respect to the provisions under this constitution.",
            ]),
            "Move the impeachment motion, and this motion can only be moved by 30% of the General Assembly. The computer number, year of study, name and signature of each member constituting the 30% will have to be reflected on the impeachment form.",
            "The annual report shall be presented at the annual general meeting.",
          ]),
        ],
      },
    ],
  },
  {
    id: "part-3",
    title: "Part Three — The Executive Committee",
    articles: [
      {
        id: "article-7",
        title: "Article 7: The Executive Committee",
        blocks: [
          p("There is hereby established the Executive Committee as an organ of the University of Zambia School of Natural Sciences Association (UNZANASA)."),
        ],
      },
      {
        id: "article-8",
        title: "Article 8: Composition",
        blocks: [
          p("The Executive Committee shall be composed of the following:"),
          list("alpha", [
            "President",
            "Vice-president",
            "Secretary General",
            "Treasurer",
            "Project Co-ordinator",
            "Academic Affairs Secretary",
            "Sports and Recreation Secretary",
            "Publicity and Information Secretary",
            "Two Committee Members",
          ]),
        ],
      },
      {
        id: "article-9",
        title: "Article 9: Eligibility of President and Vice-President",
        blocks: [
          list("decimal", [
            "The position of President and Vice-president shall strictly be for students in their final year of study under the University of Zambia School of Natural Sciences.",
            "The students who are therefore qualified or eligible for these positions are those who are in their third year of study at the time of elections and are full time students under the School of Natural Sciences.",
          ]),
        ],
      },
      {
        id: "article-10",
        title: "Article 10: Eligibility of Secretary General, Project Coordinator, Treasurer and Academic Affairs Minister",
        blocks: [
          list("decimal", [
            "The minimum years of study for the positions named in this Article shall be not less than two years of study.",
            "This means they are to serve on those positions as third years or fourth years.",
          ]),
        ],
      },
      {
        id: "article-11",
        title: "Article 11: Eligibility of Sports and Recreation Secretary, Publicity Secretary and Committee Members",
        blocks: [
          list("decimal", ["All affiliated shall be eligible for the positions above."]),
        ],
      },
      {
        id: "article-12",
        title: "Article 12: Tenure of Office",
        blocks: [
          list("decimal", [
            "One shall not be allowed to contest for the same position for two consecutive years unless the position is uncontested.",
            "All members of the Executive Committee shall hold office for one academic year during which they will not be expected to hold positions from other associations within the School of Natural Sciences, and may be re-elected if they so wish.",
            "However, if a position falls vacant during the academic year, a replacement shall be elected within twenty one (21) days and his/her term of office shall expire together with the term of office of the elected students above.",
          ]),
        ],
      },
      {
        id: "article-13",
        title: "Article 13: Election",
        blocks: [
          p("All members of the Executive Committee shall be elected by affiliated members of the association. The General Elections shall be held two weeks after the UNZASU elections."),
          p("Electoral Commission:"),
          list("decimal", [
            "There shall be an organ of the Association known as the Electoral Commission responsible for the general elections.",
            "The Electoral Commission shall comprise twelve members with due regard to gender balance who shall appoint a Chairperson, Secretary and Treasurer among themselves.",
            "The composition of the electoral commission shall be four independent members from UNZASU electoral commission (2 members) and Caritas (2 members) to oversee the electoral process.",
            "The other eight members of the Electoral Commission shall be members of UNZANASA appointed through the patron/matron upon application.",
            "Members of the Electoral Commission may serve for more than one academic year if they are appointed again by the end of the academic year.",
            "The Executive Committee shall give the necessary support to the Electoral Commission for the smooth running of its functions.",
          ]),
        ],
      },
      {
        id: "article-14",
        title: "Article 14: Functions of Members of the Executive Committee",
        blocks: [
          p("The members of the Executive Committee shall be assigned functions or duties that they execute as explained below."),
          p("Article 14.1 — Functions of President and Vice President."),
          list("decimal", [
            item("The President shall:", "alpha", [
              "Preside over all meetings and can delegate this duty to the Vice president when deemed necessary;",
              "Coordinate all the activities of the Association through the Executive;",
              "Be an ex-official member of the ad-hoc committees;",
              "Be the spokesperson and Representative of the Association or can delegate to any Executive Member to do so;",
              "Be a signatory to the Association's accounts;",
              "Be the external affairs officer.",
            ]),
            item("The Vice-president shall:", "alpha", [
              "Deputize the President and act in that capacity when the President is absent.",
              "Automatically become the President of the University of Zambia School of Natural Sciences Association (UNZANASA) if the position of the President falls vacant under the provisions of this Constitution until a new President is elected.",
              "Help other executive positions where necessary.",
            ]),
          ]),
        ],
      },
      {
        id: "article-15",
        title: "Article 15: Functions of the Treasurer and Project Coordinator",
        blocks: [
          list("decimal", [
            item("The Treasurer shall:", "alpha", [
              "Ensure that accurate records are kept of all the money received and spent on behalf of the Association by means of cash receipts, payment vouchers, supporting documents and other accounting documents;",
              "Chair the financial committee;",
              "Prepare and present an audited annual financial report at the annual general meeting;",
              "Ensure that the annual accounts are finalized, audited and distributed to all members before the final general meeting;",
              "Be a signatory to the Association's accounts and keep the money in the bank of choice of the Executive.",
            ]),
            item("The Project Coordinator shall:", "alpha", [
              "Oversee the preparation and production of project proposals by ad-hoc committees;",
              "Manage all Association projects falling under the office of the Project Coordinator.",
            ]),
          ]),
        ],
      },
      {
        id: "article-16",
        title: "Article 16: Functions of the Secretary General, Academic Affairs Secretary, Sports and Recreation Secretary and Publicity Secretary",
        blocks: [
          list("decimal", [
            item("The Secretary General shall:", "alpha", [
              "Prepare and keep minutes for all meetings;",
              "Be responsible for all correspondence regarding the activities of the Association;",
              "Be an ex-official to all ad-hoc committees;",
              "Account for all registration cases dealing with the Association.",
            ]),
            item("The Academic Affairs Secretary shall:", "alpha", [
              "Respond to the academic plight of students.",
              "Coordinate all academic activities on behalf of the Association.",
              "Be the academic representative of the students at the School of Natural Sciences.",
            ]),
            item("The Sports Recreation Secretary shall:", "alpha", [
              "Oversee all sports and recreation activities.",
              "Be the Sports and recreation representative of the association.",
            ]),
            item("The Publicity Secretary shall:", "alpha", [
              "Act as Secretary General in the absence of the Secretary General.",
              "Notify and publicize all executive and general meetings as directed by the Secretary General.",
              "Publicize resolutions of the group as may be directed by the Executive Committee.",
              "Coordinate the associations, bulletins and publications.",
              "Be responsible for the Association's email and social media platforms.",
            ]),
          ]),
        ],
      },
      {
        id: "article-17",
        title: "Article 17: Functions of Committee Members",
        blocks: [
          list("decimal", [
            item("Committee Members shall:", "alpha", [
              "Perform duties as delegated by the Executive Committee.",
            ]),
          ]),
        ],
      },
      {
        id: "article-18",
        title: "Article 18: Objectives of the Executive Committee",
        blocks: [
          p("The functions of the Executive Committee shall be:"),
          list("alpha", [
            "To support, protect and defend the interests of the Association;",
            "To ensure discipline, and work towards strengthening unity among the Association members with respect to the ideals and principles of UNZANASA;",
            "To design and implement projects, action plans and any other activities deemed necessary in order to achieve the objectives of the Association;",
            "Appoint ad-hoc committees through the President and assign duties to relevant authorities where necessary;",
            "To act as a direct link between the Association and the School of Natural Sciences through the President, Vice president and the Secretary General in liaison with the patron or matron;",
            "To recommend a patron or matron of the Association from amongst the lecturers of the School of Natural Sciences;",
            "To manage the funds and any other assets of the Association in the interest of the members;",
            "To consult and give an appraisal on the Association's activities to the School of Natural Sciences administration through the Dean and/or Assistant Deans Office;",
            "Present an annual report of the Association and such a report shall include, among others, an audited financial report;",
            "The annual report mentioned above shall be presented at the AGM within twenty-one (21) days before the general elections.",
          ]),
        ],
      },
    ],
  },
  {
    id: "part-4",
    title: "Part Four — The Disciplinary Committee",
    articles: [
      {
        id: "article-19",
        title: "Article 19: The Disciplinary Committee",
        blocks: [
          p("There is hereby established a disciplinary committee that shall be known as the Disciplinary Committee of The University of Zambia School of Natural Sciences Association (UNZANASA), hereinafter referred to as the 'Disciplinary Committee'."),
          p("Article 19.1 — Composition. The Disciplinary Committee shall be composed of seven members:"),
          list("decimal", [
            "The Vice-president of the Executive Committee shall be the chairperson of the Disciplinary Committee.",
            "The President of the Executive Committee is an ex-official member.",
            "Any other member who shall be appointed by the Executive Committee.",
            "One member of staff from the School of Natural Sciences of the University of Zambia.",
            "The other four (4) members will be appointed by the Disciplinary Committee members above.",
            "The Disciplinary Committee shall elect within itself a secretary.",
            "The Disciplinary Committee shall handle all disciplinary matters referred to it by both The Executive Committee and members of the Association.",
          ]),
          p("The Disciplinary Committee shall:"),
          list("roman", [
            "be mandated to call any executive member found wanting;",
            "be mandated to come up with a disciplinary code of offenses;",
            "ensure free and fair trial is given to every alleged offender;",
            "deem everyone innocent until found guilty.",
          ]),
          p("Article 19.2 — Powers/Functions."),
          list("decimal", [
            "The Disciplinary Committee shall handle all disciplinary matters referred to it by both the Executive Committee and members of the Association.",
            "The Disciplinary Committee shall act as an appeals tribunal in cases of Affiliate Associations.",
            "The decision of the Disciplinary Committee is binding but not final as it is appealable to the Judiciary established under the UNZASU Constitution.",
          ]),
        ],
      },
      {
        id: "article-20",
        title: "Article 20: Tenure of Office",
        blocks: [
          p("The term of the Disciplinary Committee shall be for one academic year."),
          p("In the event that the Chairperson of the Disciplinary Committee is being investigated, the Executive Committee shall appoint any other member to chair the Disciplinary Committee for the period of the case."),
          p("In the event that the chair of the Disciplinary Committee is found guilty and suspended, the appointed chairperson shall continue to act as the chairperson of the Disciplinary Committee until the new chairperson is elected."),
        ],
      },
      {
        id: "article-21",
        title: "Article 21: Guiding Principles",
        blocks: [
          list("decimal", [
            "Members of the Disciplinary Committee must be of good moral character.",
            "The decisions of the Disciplinary Committee must be in line with this Constitution and the UNZASU Constitution.",
            "The quorum for meetings is to be duly met by five members at all meetings.",
            "Members must demonstrate knowledge of the Constitution.",
            "Members may be removed for incompetence, corrupt tendencies, continued lack of independent contribution, fraud or mental incapacity.",
          ]),
        ],
      },
    ],
  },
  {
    id: "part-5",
    title: "Part Five — Finance",
    articles: [
      {
        id: "article-22",
        title: "Article 22: Finance",
        blocks: [
          list("decimal", [
            item("The sources of funds for the Association shall be:", "alpha", [
              "Members' affiliation fees and annual association subscriptions.",
              "Voluntary contributions from members and supporters.",
              "Donations from government and national institutions/organizations.",
              "Donations from embassies, high commissions, business houses, banks, trade unions, international organizations and donor agencies.",
              "Projects and services lawfully undertaken by the Association.",
            ]),
            item("There shall be a financial committee that shall be:", "alpha", [
              "Composed of treasurers of all associations under UNZANASA and chaired by the Executive Treasurer.",
              "The executive shall prepare a budget at the beginning of their tenure which shall be presented to the financial committee for approval before any expenditures are incurred.",
              "After any expense approved in (b), the financial chairperson who is the executive treasurer shall present financial reports quarterly to the entire financial committee.",
            ]),
          ]),
        ],
      },
      {
        id: "article-23",
        title: "Article 23: Association Bank Account",
        blocks: [
          p("The Association shall bank its money with any bank of its choice."),
          p("Article 23.1 — Signatories. The following shall be the signatories to the Association's account:"),
          list("alpha", ["Executive President", "Secretary General", "Treasurer"]),
        ],
      },
      {
        id: "article-24",
        title: "Article 24: Auditing",
        blocks: [
          list("decimal", [
            "The auditor(s) nominated from the School of Natural Sciences internal auditing unit, by the Financial Committee and approved by the association executive shall audit the accounts of the Association.",
            "The auditing of the accounts of the Association shall be done at least once before the annual General Assembly.",
          ]),
        ],
      },
    ],
  },
  {
    id: "part-6",
    title: "Part Six — Dissolution",
    articles: [
      {
        id: "article-25",
        title: "Article 25: Dissolution of the Association",
        blocks: [
          list("decimal", [
            "The Association shall be dissolved at least two weeks before the elections and after the last annual meeting.",
            "In an event of any other need other than that of elections, the Association shall be dissolved by a two-thirds majority vote at a special general meeting of the Association convened for the purpose, and upon such dissolution the property of the Association shall be dealt with and its affairs wound up in such manner as may be determined by the Association at such meeting.",
          ]),
        ],
      },
    ],
  },
  {
    id: "part-7",
    title: "Part Seven — Amendment",
    articles: [
      {
        id: "article-26",
        title: "Article 26: Amendment of the Constitution",
        blocks: [
          list("decimal", [
            "The General Assembly may amend this constitution either at an ordinary meeting or at an extraordinary meeting with at least a two-thirds (2/3) majority vote.",
            "Proposals for constitutional amendments shall be submitted in writing to the Secretary General of the Association at least thirty (30) days prior to the ordinary meeting or extraordinary meeting at which such proposals have to be considered.",
            "Provisions of this constitution shall bind every member of the association, all regulations and by-laws of the Association and all amendments made thereto in accordance with the provisions of this constitution.",
          ]),
        ],
      },
    ],
  },
];
