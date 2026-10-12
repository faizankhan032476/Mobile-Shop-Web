import { Prose } from "@/components/layout/Prose";
export const metadata = { title: "FAQ" };
const QA = [
  ["Is this a real shop?", "No. Orbit is a frontend-only demo. Orders you place are saved in your browser and are not fulfilled."],
  ["Which payment methods are available?", "Cash on Delivery is the intended method. Bank transfer and card are labelled demo options and never take payment."],
  ["How is shipping calculated?", "Orders of Rs 150,000 or more ship free. Smaller orders pay a flat Rs 500."],
  ["Which discount codes work?", "ORBIT5 gives 5% off and WELCOME2 gives 2% off, as demo codes."],
  ["Where is my cart stored?", "In this browser’s local storage. Clearing site data removes it."],
];
export default function FAQ() {
  return <Prose title="Frequently asked questions">{QA.map(([q, a]) => <details key={q} className="card px-5 py-4"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-2 text-muted">{a}</p></details>)}</Prose>;
}
