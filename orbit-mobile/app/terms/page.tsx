import { Prose } from "@/components/layout/Prose";
export const metadata = { title: "Terms" };
export default function Terms() {
  return <Prose title="Terms of use" intro="Demo notice: placeholder text, not legal terms.">
    <p>Orbit is a demonstration project. Prices, stock and orders are simulated and carry no commercial obligation.</p>
    <h2>Before launch</h2><p>A real store needs reviewed terms covering orders, returns, warranty, delivery and payment.</p>
  </Prose>;
}
