const token = localStorage.getItem('token');
document.getElementById('payBtn').addEventListener('click', async () => {
try {
    const res = await axios.post('/api/donation/donate', {}, {
    headers: { Authorization: `Bearer ${token}` }
    });

    const cashfree = Cashfree({ mode: "sandbox" });
    cashfree.checkout({
    paymentSessionId: res.data.paymentSessionId,
    redirectTarget: "_self"
    });
    } catch (err) {
        console.error(err);
        alert("Failed to initiate payment");
    }
});