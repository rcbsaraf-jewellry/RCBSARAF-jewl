import { formLookups } from "@/lib/queries";
import { saveItem } from "@/server/actions";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NewItemPage() {
  const { taxes } = await formLookups();
  return (
    <form action={saveItem} className="sb-page mx-auto max-w-2xl">
      <PageHeader title="New Item" actions={<button className="sb-btn sb-btn-primary">Save</button>} />
      <div className="form-grid-2 sb-card p-5">
        <label>
          <span className="sb-label">Type</span>
          <select name="itemType" className="sb-select">
            <option value="goods">Goods</option>
            <option value="service">Service</option>
          </select>
        </label>
        <label>
          <span className="sb-label">Name</span>
          <input name="name" required className="sb-input" />
        </label>
        <label>
          <span className="sb-label">SKU</span>
          <input name="sku" className="sb-input" />
        </label>
        <label>
          <span className="sb-label">HSN / SAC</span>
          <input name="hsn" className="sb-input" />
        </label>
        <label>
          <span className="sb-label">Selling Price</span>
          <input name="saleRate" defaultValue="0" className="sb-input" />
        </label>
        <label>
          <span className="sb-label">Purchase Price</span>
          <input name="purchaseRate" defaultValue="0" className="sb-input" />
        </label>
        <label>
          <span className="sb-label">Tax</span>
          <select name="taxId" className="sb-select">
            <option value="">None</option>
            {taxes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 pt-6 text-[13px]">
          <input type="checkbox" name="trackInventory" /> Track inventory
        </label>
        <label>
          <span className="sb-label">Opening Stock</span>
          <input name="stockOnHand" defaultValue="0" className="sb-input" />
        </label>
        <label>
          <span className="sb-label">Reorder Point</span>
          <input name="reorderPoint" defaultValue="0" className="sb-input" />
        </label>
        <label className="span-2">
          <span className="sb-label">Description</span>
          <textarea name="description" rows={3} className="sb-textarea" />
        </label>
      </div>
    </form>
  );
}
