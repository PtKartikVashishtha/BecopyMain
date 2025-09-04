export const HELLO_DEVELOPER = {
    java: `I am Mark = < web developer >;\nIn love with coding = true;\nConstantly committing(!);`,
    python: `I am Mark = < web developer >;\nIn love with coding = true;\nConstantly committing(!);`,
    html: `I am Mark = < web developer >;\nIn love with coding = true;\nConstantly committing(!);`
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
