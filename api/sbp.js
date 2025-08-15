apture: true, // обязательный параметр для SBP
        receipt: {
          customer: { email },
          items: [
            {
              description: 'Запись к енотам',
              quantity: 1,
              amount: { value: amount, currency: 'RUB' },
              vat_code: 0 // НДС 0%
            }
          ]
        }
      })
    });

    const data = await response.json();

    if (data.confirmation && data.confirmation.confirmation_url) {
      res.status(200).json({ url: data.confirmation.confirmation_url });
    } else {
      res.status(500).json({ error: 'Payment creation failed', details: data });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
}
