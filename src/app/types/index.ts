// Definisikan tipe berdasarkan skema tabel 'Invoices' Anda
export type Invoice = {
  invoice_id: number;
  student_id: number;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  amount_paid: number;
  status: 'Unpaid' | 'Paid' | 'Partially Paid' | 'Overdue' | 'Cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
};
