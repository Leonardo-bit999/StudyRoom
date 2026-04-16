function atualizarRelogio() {
    const agora = new Date();

    let horas = agora.getHours();
    let minutos = agora.getMinutes();
    let segundos = agora.getSeconds();

    //formatção para exibir dois digitos
    horas = horas.toString().padStart(2, '0');
    minutos = minutos.toString().padStart(2, '0');
    segundos = segundos.toString().padStart(2, '0');

    const horaFormatada = `${horas}:${minutos}:${segundos}`;

    document.getElementById('hora').textContent = horaFormatada;

    const opcoesData = {
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const dataFormatada = agora.toLocaleDateString('pt-BR', opcoesData);
    
    document.getElementById('data').textContent = dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1);
}
atualizarRelogio();
setInterval(atualizarRelogio, 1000);


