import { Prose } from "@/components/layout/Prose";
export const metadata = { title: "About" };
export default function About() {
  return <Prose title="About Orbit" intro="A single-owner mobile phone shop concept for Pakistan.">
    <p>Orbit is a demonstration storefront: one owner, one catalog, one checkout. It shows how a focused phone shop can present clear PKR pricing, honest stock levels and a simple buying flow.</p>
    <h2>This is a demo</h2><p>Products, prices, stock, reviews and orders are simulated and stored in your browser. No payments are processed and no goods are shipped. A real backend, authentication and payment provider will be connected in a later phase.</p>
  </Prose>;
}
