import { Prose } from "@/components/layout/Prose";
export const metadata = { title: "Privacy" };
export default function Privacy() {
  return <Prose title="Privacy" intro="Demo notice: this page is placeholder text, not a legal policy.">
    <p>This frontend demo has no server. Information you enter (cart, wishlist, checkout details, demo orders) is saved only in your browser’s local storage and is never transmitted.</p>
    <h2>Before launch</h2><p>A real store needs a reviewed privacy policy covering data collection, retention, cookies and contact details.</p>
  </Prose>;
}
