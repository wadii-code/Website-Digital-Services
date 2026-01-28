export default function handler(req, res) {
  res.status(200).json({
    success: true,
    plans: [
      { id: 1, name: "Monthly Plan", price: 10 },
      { id: 2, name: "2 Months Plan", price: 18 },
      { id: 3, name: "Annual Plan", price: 70 }
    ]
  });
}
