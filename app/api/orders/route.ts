async function handleCommander() {
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        documentType: 'Certificat de Cession', // le type de document
        formData: dataDuFormulaire,             // les infos du document saisies par l'utilisateur
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Erreur lors de la création')
    }

    //  La commande a été créée avec succès dans Supabase !
    //  On redirige l'utilisateur vers l'écran de paiement avec l'ID de sa commande
    window.location.href = `/paiement/${result.orderId}`

  } catch (error) {
    alert("Impossible de créer la commande : " + error.message)
  }
}
