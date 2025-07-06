const bcrypt = require('bcrypt');

const userDataText = `
00452732352 DENISE DE CASTRO
LIMA
denise.lima@prof.ce.gov.br  
00663912377 ERIKA MARIA
MOREIRA BESSA
erika.bessa@prof.ce.gov.br  
01817554328 CONCEICAO
FRANCISMEYRE
FEITOSA OLIVEIRA
conceicao.oliveira@prof.ce.gov.br  
02053796308 LUCIANE KELY
GONCALVES DE LIMA
MARTINS
luciane.martins@prof.ce.gov.br  
02284067301 ANTONIA MICARLA
RUFINO LEITE
antonia.leite@prof.ce.gov.br  
02669542352 MARIA ODETE DA
SILVA CARNEIRO
maria.carneiro13@prof.ce.gov.br  
02707014354 MARCOS VINICIUS
OLIVEIRA REZENDE
marcos.rezende@prof.ce.gov.br  
03007180392 MAGNOLIA
CARNEIRO DE
OLIVEIRA
magnolia.oliveira@prof.ce.gov.br  
03597958389 TALLYNE DE
MAGALHAES
SILVEIRA
tallyne.silveira@prof.ce.gov.br  
03957566347 TACIELMA BEZERRA
PINHEIRO
tacielma.pinheiro@prof.ce.gov.br
04159954340 SUYANNE SOARES
FERNANDES
suyanne.fernandes@prof.ce.gov.br  
04179761351 FRANCISCA ROBERTA
NEGREIROS MARTINS
francisca.martins2@prof.ce.gov.br  
05026593437 FRANCISCO
VANDERLI DE ARAUJO
francisco.araujo34@prof.ce.gov.br  
05129177363 ANTONIA PATRICIA
DIAS CHAVES
antonia.chaves1@prof.ce.gov.br  
05409224396 DANIEL MOTA VIDAL daniel.vidal@prof.ce.gov.br  
06238931345 MASSARO VICTOR
PINHEIRO ALVES
massaro.alves@prof.ce.gov.br  
06265376306 MARIA TALUANNE
AQUINO SILVA
maria.silva404@prof.ce.gov.br  
06650825336 FABRICIO CANDIDO
DUARTE DE LAVOR
fabricio.lavor@prof.ce.gov.br  
06781725440 TARLISON PEREIRA
LINS
tarlison.lins@prof.ce.gov.br  
06822824308 KARLA KAROLINA
CAVALCANTE
CARVALHO
karla.carvalho@prof.ce.gov.br  
07152681392 MARIA LAISSE
BEZERRA DE SOUZA
maria.souza94@prof.ce.gov.br  
07740474371 WILLIAM KELVEN
FREIRE BEZERRA
william.bezerra1@prof.ce.gov.br  
07841541473 ALCIMARIA
FERNANDES DA SILVA
alcimaria.silva@prof.ce.gov.br  
10657434400 FELIPE DE ARAUJO
SILVA
felipe.silva1@prof.ce.gov.br  
10772454400 ALINE CARMOSINA
DA SILVA QUEIROZ
aline.queiroz@prof.ce.gov.br  
11086142489 LUCAS DAMIAO
RODRIGO DE
OLIVEIRA
lucas.oliveira8@prof.ce.gov.br  
12083768450 ITALO LEONARDO DE
LIMA QUEIROZ
italo.queiroz@prof.ce.gov.br  
70318599481 FRANCILEIDE DO
NASCIMENTO LIMA
francileide.lima@prof.ce.gov.br  
90298322315 EVANILSON PEREIRA
NUNES
evanilson.nunes@prof.ce.gov.br
`;

// Split records by the special character or by a new CPF on a new line
const records = userDataText.split('').map(r => r.trim()).filter(Boolean);

let sqlStatements = '';

// Process each record
records.forEach(record => {
    // There might be multiple users in a single "record" if a separator was missed
    const usersInRecord = record.split(/(?=\d{11})/).map(u => u.trim()).filter(Boolean);
    
    usersInRecord.forEach(userText => {
        const cpfMatch = userText.match(/\d{11}/);
        const emailMatch = userText.match(/[\w.-]+@prof\.ce\.gov\.br/);

        if (cpfMatch && emailMatch) {
            const cpf = cpfMatch[0];
            const email = emailMatch[0];
            
            // Extract name by removing CPF, email, and extra characters
            let name = userText.replace(cpf, '').replace(email, '').replace(/\n/g, ' ').trim();
            name = name.replace(/\s\s+/g, ' '); // Replace multiple spaces with a single one
            
            // Hash the password (CPF)
            const saltRounds = 10;
            const hashedPassword = bcrypt.hashSync(cpf, saltRounds);

            // Generate SQL INSERT statement
            const sql = `INSERT INTO public.usuarios (nome, email, tipo, senha_hash, ativo) VALUES ('${name}', '${email}', 'usuario', '${hashedPassword}', true);\n`;
            sqlStatements += sql;
        }
    });
});

console.log(sqlStatements);
