export interface Program {
  _id: string,
  name: string;
  code: {
    java: string;
    python: string;
    html: string;
  }
  views: number,
  copies: number,
  shares: number
}
