export const HELLO_DEVELOPER = {
    java: `<span style="color: #000000;">I am Mark = < web developer >;\nIn love with coding = true;\nConstantly committing(!);</span>`,
    python: `<span style="color: #000000;">I am Mark = < web developer >;\nIn love with coding = true;\nConstantly committing(!);</span>`,
    html: `<span style="color: #000000;">I am Mark = < web developer >;\nIn love with coding = true;\nConstantly committing(!);</span>`
};

export interface ProfileCardProps {
    image?: string;
    title: string;
    subtitle: string;
    country: string;
}

export const ARTICLES = [
    "Senior Developer at Google",
    "Frontend Dev at Meta",
    "Backend Engineer at Amazon"
];

export const LANGUAGES = [
    { id: "c", name: "Java", icon: "WandSparkles" },
    { id: "python", name: "Python", icon: "WandSparkles" },
    { id: "html", name: "HTML", icon: "WandSparkles" }
];
