const db = require("../config/db");

const dashboard = (req, res) => {
  const data = {};

  db.query("SELECT COUNT(*) AS totalUser FROM users", (err, user) => {
    if (err) return res.status(500).json({ message: err.message });

    data.totalUser = user[0].totalUser;

    db.query("SELECT COUNT(*) AS totalEvent FROM events", (err, event) => {
      if (err) return res.status(500).json({ message: err.message });

      data.totalEvent = event[0].totalEvent;

      db.query(
        "SELECT COUNT(*) AS totalKategori FROM ticket_categories",
        (err, kategori) => {
          if (err) return res.status(500).json({ message: err.message });

          data.totalKategori = kategori[0].totalKategori;

          db.query(
            "SELECT COUNT(*) AS totalOrder FROM orders",
            (err, order) => {
              if (err)
                return res.status(500).json({ message: err.message });

              data.totalOrder = order[0].totalOrder;

              db.query(
                "SELECT COUNT(*) AS totalPayment FROM payments",
                (err, payment) => {
                  if (err)
                    return res.status(500).json({ message: err.message });

                  data.totalPayment = payment[0].totalPayment;

                  db.query(
                    "SELECT SUM(total_harga) AS totalPendapatan FROM orders",
                    (err, pendapatan) => {
                      if (err)
                        return res.status(500).json({
                          message: err.message,
                        });

                      data.totalPendapatan =
                        pendapatan[0].totalPendapatan || 0;

                      res.json(data);
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  });
};

module.exports = {
  dashboard,
};