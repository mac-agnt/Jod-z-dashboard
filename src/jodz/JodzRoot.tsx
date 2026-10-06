/* Mount point for the Jod-Z modules inside the Pulse shell: the page, the record drawer and the toast. */
import "./jodz.css";
import { useJodz, closeDrawer, decideApproval, openRecord } from "./store";
import { staff, linkLabel, fmtDate } from "./derive";
import { Drawer, KV, Note, Btn, Pill, RecLink, Section } from "./ui";
import SalesWholesale from "./pages/SalesWholesale";
import Inventory from "./pages/Inventory";
import Forecasting from "./pages/Forecasting";
import Advertising from "./pages/Advertising";
import CampaignDrawer from "./drawers/CampaignDrawer";
import SignalDrawer from "./drawers/SignalDrawer";
import OrderDrawer from "./drawers/OrderDrawer";
import RetailerDrawer from "./drawers/RetailerDrawer";
import VariantDrawer from "./drawers/VariantDrawer";
import PoDrawer from "./drawers/PoDrawer";
import PurchaseReviewDrawer from "./drawers/PurchaseReviewDrawer";
import ReturnDrawer from "./drawers/ReturnDrawer";
import InvoiceDrawer from "./drawers/InvoiceDrawer";
import BillDrawer from "./drawers/BillDrawer";

export const JODZ_PAGES = ["Dashboard", "Inventory", "Forecasting", "Advertising"];

export function JodzPage({ page }: { page: string }) {
  if (page === "Dashboard") return <SalesWholesale />;
  if (page === "Inventory") return <Inventory />;
  if (page === "Forecasting") return <Forecasting />;
  if (page === "Advertising") return <Advertising />;
  return null;
}

function ApprovalDrawer({ id }: { id: string }) {
  const s = useJodz();
  const a = s.approvals.find((x) => x.id === id);
  if (!a) return null;
  const waiting = a.status === "Awaiting approval";
  return (
    <Drawer
      eyebrow={a.kind + " approval · " + a.id}
      title={a.title}
      sub={"Raised " + fmtDate(a.raised) + " by " + a.requestedBy}
      onClose={closeDrawer}
      foot={waiting ? (
        <>
          <Btn kind="primary" onClick={() => decideApproval(a.id, true)}>Approve in demo</Btn>
          <Btn kind="ghost" onClick={() => decideApproval(a.id, false)}>Decline</Btn>
          <span style={{ flex: 1 }} />
          <Btn onClick={() => openRecord(a.link)}>Open {linkLabel(a.link)}</Btn>
        </>
      ) : <Btn onClick={() => openRecord(a.link)}>Open {linkLabel(a.link)}</Btn>}
    >
      <KV items={[["Status", <Pill tone={waiting ? "warn" : a.status === "Declined" ? "" : "ok"}>{a.status}</Pill>], ["Value", a.value], ["Approver", staff(a.approver).name], ["Record", <RecLink link={a.link}>{linkLabel(a.link)}</RecLink>]]} />
      <Section title="What this does">
        <Note>{a.detail}</Note>
      </Section>
      <Note tone="warn">Approving here changes demo records only. Nothing is sent to a supplier or retailer, and no money moves.</Note>
    </Drawer>
  );
}

function RecordDrawer() {
  const s = useJodz();
  const d = s.drawer;
  if (!d) return null;
  switch (d.kind) {
    case "order": return <OrderDrawer id={d.id} />;
    case "retailer": return <RetailerDrawer id={d.id} />;
    case "variant": return <VariantDrawer id={d.id} />;
    case "po": {
      const po = s.pos.find((p) => p.id === d.id);
      return po && po.status === "Draft" ? <PurchaseReviewDrawer id={d.id} /> : <PoDrawer id={d.id} />;
    }
    case "return": return <ReturnDrawer id={d.id} />;
    case "invoice": return <InvoiceDrawer id={d.id} />;
    case "bill": return <BillDrawer id={d.id} />;
    case "approval": return <ApprovalDrawer id={d.id} />;
    case "campaign": return <CampaignDrawer id={d.id} />;
    case "signal": return <SignalDrawer id={d.id} />;
    default: return null;
  }
}

/** Drawer and toast float above every Pulse page, so Home and Work can open records too. */
export function JodzOverlays() {
  const s = useJodz();
  return (
    <div style={{ fontFamily: "var(--ui)" }}>
      <RecordDrawer />
      {s.toast && <div className="jz-toast" role="status">{s.toast}</div>}
    </div>
  );
}
