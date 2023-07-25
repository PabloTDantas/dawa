const express = require('express');
const app = express();
const input = require("input");
const cors = require('cors');
const fs = require('fs');

app.use(cors());
app.set('trust proxy', 1);
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");

const rateLimit = require('express-rate-limit');


const limiter = rateLimit({
	windowMs: 15 * 1000, // 30 segundos
	max: 2, // limit each IP to 1 request per windowMs
	message: 'Limite de requisições excedido, aguarde 30 segundos antes de tentar novamente.',
});



app.use(limiter);


const PORT = process.env.PORT || 80;


const Grupos = [
	{ chat: "Skynet02Robot", bot: "Skynet02Robot" },
	{ chat: "Skynet02Robot", bot: "Skynet02Robot" },

];



const apiId = 24216953; //https://my.telegram.org/auth
const apiHash = "0512d08ef5adbaa122eee0a00ad9242a"; //https://my.telegram.org/auth
const stringSession = new StringSession(""); //exibira no console ao gerar trocar aq
const telegram = new TelegramClient(stringSession, apiId, apiHash, {
	connectionRetries: 5
});



async function iniciarProcesso() {
	try {
		await telegram.start({
			phoneNumber: "+5561986757412", // número de telefone
			phoneCode: async () =>await input.text(""),
			onError: (err) => console.log(err)
		});
		console.log("TELEGRAM: Conectado com sucesso!");
		console.log(telegram.session.save());
		await telegram.sendMessage("me", { message: "To Online!" });
	} catch (error) {
		console.error("Erro ao iniciar o processo:", error);
	}
}

async function reiniciarProcesso() {
	console.log("REINICIANDO O PROCESSO...");
	await telegram.disconnect(); // Desconecta do Telegram antes do reinício
	await new Promise(resolve => setTimeout(resolve, 20000)); // Aguarda 5 segundos (ajuste conforme necessário)
	iniciarProcesso(); // Inicia o processo novamente após o reinício
}


// Chamar a função para iniciar o processo
iniciarProcesso();



// Agendar o reinício do processo a cada 1 minuto
const intervaloReinicio = 60 * 60 * 1000; // 1 minuto em milissegundos
setInterval(reiniciarProcesso, intervaloReinicio);


app.get("/puxadascom/mk/:type/:q/", limiter, async (req, res) => {
	const ip = req.ip;

	// Verifica se o endereço IP é o IP que deseja bloquear
	if (ip === "34.82.158.141") {
		console.log(`Endereço IP bloqueado: ${ip}`);
		return res.status(403).send("Acesso negado"); // Retorna um status de acesso negado
	}

	const referer = req.headers.referer || '';
	var db = JSON.parse(fs.readFileSync("db.json"));
	var achou3 = false;
	const type = req.params.type.toLowerCase() || '';
	const query = req.params.q.toLowerCase() || '';

	if (!query) return res.send("Coloque o tipo da consulta");
	
	if (type.search(/cpf1|cpf2|cpf3|telefone|cns|cnpj|nome|placa|ip|cep/) === -1) return res.send('Tipo de consulta invalida');

	console.log(`[CONSULTA]: IP=${ip}, Origem=${referer}, Tipo=${type}, Query=${query}`);

	if (db && db[type] && db[type][query]) return res.send(db[type][query]);

	const Consultar = {
		nego() {
			if (query.length != 11) return res.json({
				http_code: 400,
				error: "Cpf deve conter 11 digitos"
			})
			telegram.sendMessage(Grupos[1].chat, {
				message: `/cpf2 ${query}`
			})
				.catch((e) => res.json({
					http_code: 500,
					error: "Não foi possível fazer a consulta"
				}));
		}
	}
	if (Consultar[type]) Consultar[type]();
	else await telegram.sendMessage(Grupos[0].chat, {
		message: `/${type} ${query}`
	})
		.catch((e) => {
			res.send(
				"Não foi possível fazer a consulta"
			)
			console.log("DEBUG NO CÓDIGO:", e)
		});


	async function OnMsg(event) {
		const message = event.message;

		// Obtém o texto puro da mensagem
		const textPure = message && message.text ? message.text : message && message.message ? message.message : '';

		// Converte o texto para letras minúsculas
		const text = message && message.text ? message.text.toLowerCase() : message && message.message ? message.message.toLowerCase() : '';

		// Obtém a mensagem de resposta marcada
		const msgMarked = await message.getReplyMessage();

		// Obtém o texto da mensagem de resposta marcada e converte para letras minúsculas
		const msgMarkedText = msgMarked && msgMarked.text ? msgMarked.text.toLowerCase() : msgMarked && msgMarked.message ? msgMarked.message.toLowerCase() : '';

		// Obtém o remetente da mensagem
		const sender = await message.getSender();

		// Obtém o ID do remetente
		const senderId = sender && sender.username ? sender.username : '';

		// Obtém o chat da mensagem
		const chat = await message.getChat();

		// Obtém o ID do chat
		const chatId = chat && chat.username ? chat.username : '';

		// Remove caracteres especiais e converte para letras minúsculas para a verificação
		const msgggveri = msgMarkedText.replace(/\/|-|\.|\`|\*/g, '').toLowerCase();
		const queryverii = query.replace(/\/|-|\.|\`|\*/g, '').toLowerCase();
		const txtuuuveri = text.replace(/\/|-|\.|\`|\*/g, '').toLowerCase();


		for (let i of Grupos) {
			try {
				if ((chatId == i.chat && senderId == i.bot) && (msgggveri.includes(queryverii) || txtuuuveri.includes(queryverii) || txtuuuveri.includes(query))) {
					achou3 = true;
					await telegram.markAsRead(chat);
					
					if (text.includes("⚠️"))
						return res.send("Não encontrado");

					if (text.includes("Inválido") || text.includes("INVÁLIDO"))
						return res.send("Invalido");
				}

				if ((chatId == i.chat && senderId == i.bot) && (msgggveri.includes(queryverii) || txtuuuveri.includes(queryverii) || text.includes(".") || text.includes("•"))) {
					achou3 = true;
					await telegram.markAsRead(chat);

					let str = textPure;
					str = str.replace(/\*/gi, "");
					str = str.replace(/\`/gi, "");
					str = str.replace(/\+/gi, "");
					str = str.replace(/\[/gi, "");
					str = str.replace(/\]/gi, "");
					str = str.replace(/\(/gi, "");
					str = str.replace(/\)/gi, "");	
					str = str.replace(/\•/gi, "");	
					str = str.replace(/\n\n\n/gi, "\n\n");
					str = str.replace(/CONSULTA DE CPF 2 \n\n/gi, "CONSULTA DE CPF ");
					str = str.replace(/🔍 CONSULTA DE CPF1 COMPLETA 🔍/gi, "CONSULTA DE CPF ");
					str = str.replace(/🔍 CONSULTA DE CPF3 COMPLETA 🔍/gi, "CONSULTA DE CPF ");
					str = str.replace(/🔍 CONSULTA DE CPF 4 🔍/gi, "CONSULTA DE CPF ");
                    str = str.replace(/BY: @MkBuscasRobot/gi, "");
					str = str.replace(/\n\nUSUÁRIO: Rick/gi, '');
					str = str.replace(/USUÁRIO: Rick\n\n/gi, '');
					str = str.replace(/ USUÁRIO: Rick/gi, '');
					str = str.replace(/🔍|V1|V2/gi, '');
					str = str.replace(/COMPLETA/gi, '');
					str = str.replace(/CONSULTA DE CPF 2/gi, 'CONSULTA DE CPF');
					str = str.replace(/\n\nBY: @MkBuscasRobot/gi, "");
					str = str.replace(/\n\nREF: @refmkbuscas/gi, '');
					str = str.replace(/\nREF: @refmkbuscas/gi, '');
					str = str.replace(/REF: @refmkbuscas/gi, '');
					str = str.replace(/EMPTY/gi, "");
					str = str.replace(/\n\n\n\n/gi, "\n\n");
					str = str.replace(/USUÁRIO: Rick/gi, '');
					str = str.replace(/🔛 BY: @Skynet02Robot/gi, '');
					str = str.replace(/COMPLETA/gi, '');
					str = str.replace(/𝗖𝗢𝗡𝗦𝗨𝗟𝗧𝗔 𝗗𝗘 𝗖𝗣𝗙\n\n/gi, '');
					str = str.replace(/𝗖𝗢𝗡𝗦𝗨𝗟𝗧𝗔 𝗗𝗘 𝗣𝗟𝗔𝗖𝗔\n\n/gi, '');
					str = str.replace(/𝗖𝗢𝗡𝗦𝗨𝗟𝗧𝗔 𝗗𝗘 𝗧𝗘𝗟𝗘𝗙𝗢𝗡𝗘\n\n/gi, '');
					str = str.replace(/𝗖𝗢𝗡𝗦𝗨𝗟𝗧𝗔 𝗗𝗘 𝗡𝗢𝗠𝗘\n\n/gi, '');
					str = str.replace(/𝗖𝗢𝗡𝗦𝗨𝗟𝗧𝗔 𝗗𝗘 𝗡𝗢𝗠𝗘\n\n/gi, '');



					let json = {};
					const linhas = str.split("\n");
					for (const t of linhas) {
						const key = t.split(": ");
						key[0] = key[0]
							.replace(/\//g, " ")
							.toLowerCase()
							.replace(/(?:^|\s)\S/g, function (a) {
								return a.toUpperCase();
							})
							.replace(/ |•|-|•|/g, "");
						json[key[0]] = key[1];
					}
					if (db && db[type]) db[type][query] = str;
					else db[type] = {}, db[type][query] = str;
					fs.writeFileSync("db.json", JSON.stringify(db, null, "\t"));
					res.send(str);
				}
				return;
			} catch (e) {
				if (achou3) return;
				res.send("error no servidor, não foi possivel fazer a consulta"
				)
				console.log(e);
			}
		}
	}
	telegram.addEventHandler(OnMsg, new NewMessage({}));
	setTimeout(() => {
		if (achou3) return;
		res.send('servidor demorou muito para responder'
		);
	}, 40000);
});




app.use((req, res, next) => {
	res.status(404).send('Página não encontrada');
});

app.listen(PORT, () => {
	console.log(`Aplicativo rodando na url: http://localhost:${PORT}`);
});

let file = require.resolve(__filename)
fs.watchFile(file, () => {
	fs.unwatchFile(file)
	console.log(`Arquivo Atualizado ${__filename}`)
	delete require.cache[file]
	require(file)
})
