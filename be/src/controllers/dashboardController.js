const supabase = require("../config/supabase");

const dashboard = async (_req, res) => {
  try {
    const tables = ["users", "events", "ticket_categories", "orders", "payments"];
    const countResults = await Promise.all(
      tables.map((table) =>
        supabase.from(table).select("id", { count: "exact", head: true })
      )
    );

    const countError = countResults.find((result) => result.error);
    if (countError) throw countError.error;

    let totalPendapatan = 0;
    const pageSize = 1000;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabase
        .from("orders")
        .select("total_harga")
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      totalPendapatan += data.reduce(
        (total, order) => total + Number(order.total_harga || 0),
        0
      );
      if (data.length < pageSize) break;
    }

    return res.json({
      totalUser: countResults[0].count ?? 0,
      totalEvent: countResults[1].count ?? 0,
      totalKategori: countResults[2].count ?? 0,
      totalOrder: countResults[3].count ?? 0,
      totalPayment: countResults[4].count ?? 0,
      totalPendapatan,
    });
  } catch (error) {
    console.error("Gagal memuat dashboard:", error.message);
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  dashboard,
};
