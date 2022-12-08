const venom = require("venom-bot");
const { NlpManager } = require("node-nlp");
const axios = require("axios");
require("colors");

const banner = `
██     ██ ██   ██  █████  ████████ ███████ ██████   ██████  ████████ ███    ██ ██      ██████  
██     ██ ██   ██ ██   ██    ██    ██      ██   ██ ██    ██    ██    ████   ██ ██      ██   ██ 
██  █  ██ ███████ ███████    ██    ███████ ██████  ██    ██    ██    ██ ██  ██ ██      ██████  
██ ███ ██ ██   ██ ██   ██    ██         ██ ██   ██ ██    ██    ██    ██  ██ ██ ██      ██      
 ███ ███  ██   ██ ██   ██    ██    ███████ ██████   ██████     ██    ██   ████ ███████ ██      
                                                                                            
`;

const manager = new NlpManager({ languages: ['pt'], forceNER: true });

//treinamento de mensagem do cliente
manager.addDocument('pt', 'bom dia', 'SAUDAÇÃO');
manager.addDocument('pt', 'boa tarde', 'SAUDAÇÃO');
manager.addDocument('pt', 'boa noite', 'SAUDAÇÃO');
manager.addDocument('pt', 'tudo bom', 'SAUDAÇÃO');
manager.addDocument('pt', 'tudo bem?', 'SAUDAÇÃO');
manager.addDocument('pt', 'olá', 'SAUDAÇÃO');
manager.addDocument('pt', 'oi', 'SAUDAÇÃO');
manager.addDocument('pt', 'eai', 'SAUDAÇÃO');
manager.addDocument('pt', 'opa', 'SAUDAÇÃO');
manager.addDocument('pt', 'aoba', 'SAUDAÇÃO');

manager.addDocument('pt', 'que horas fecha?', 'HORARIO');
manager.addDocument('pt', 'que horas abre?', 'HORARIO');
manager.addDocument('pt', 'que horario vocês trabalham?', 'HORARIO');
manager.addDocument('pt', 'esta aberto?', 'HORARIO');

manager.addDocument('pt', 'qual o endereço?', 'ENDEREÇO');
manager.addDocument('pt', 'qual o local de trabalho de vocês?', 'ENDEREÇO');
manager.addDocument('pt', 'onde vocês trabalham?', 'ENDEREÇO');
manager.addDocument('pt', 'onde fica a empresa?', 'ENDEREÇO');

manager.addDocument('pt', 'falar com atendente', 'ATENDENTE');
manager.addDocument('pt', 'contato do antendente', 'ATENDENTE');
manager.addDocument('pt', 'falar com uma pessoa de verdade', 'ATENDENTE');
manager.addDocument('pt', 'numero do atendente', 'ATENDENTE');

//treinamento de respostas
manager.addAnswer('pt', 'SAUDAÇÃO', 'Olá, sou um BOT, qual sua duvida?');
manager.addAnswer('pt', 'SAUDAÇÃO', 'Olá, sou um BOT que gosta de tirar duvidas, qual a sua?');

manager.addAnswer('pt', 'HORARIO', 'estamos abertos de segunda a sexta \ndas 00:00 até 00:00');
manager.addAnswer('pt', 'HORARIO', 'trabalhamos de segunda a sexta \ndas 00:00 até 00:00');

manager.addAnswer('pt', 'ENDEREÇO', 'entendido, vou te mandar o endereço');
manager.addAnswer('pt', 'ENDEREÇO', 'estamos nesse endereço abaixo');
manager.addAnswer('pt', 'ENDEREÇO', 'estamos aguardando sua visita');

manager.addAnswer('pt', 'ATENDENTE', 'entendido, vou te mandar o contato do atendente');
manager.addAnswer('pt', 'ATENDENTE', 'contato do meu humano');

class bot {
    constructor() {
      //pass
    }

    //verifica conexão com a internet
    async checkNet() {
      try {
        await axios.get("https://google.com"); 
      } catch (err) {
        console.log("[-] internet OFF".red);
        process.exit(1);
      }
    }

    //funcão main
    async start() {
      this.checkNet();

      //treina a IA
      await manager.train();
      manager.save();

      venom.create("BOT")
      .then(client => start(client))
      .catch(err => console.error(err));

      const start = client => {
        console.clear();
        console.log(banner.green);
        
        //função quando o cliente manda uma mensagem
        client.onMessage(async message => {
          if (message.isGroupMsg === false) { //verifica se a mensagem é de grupo
            let response = await manager.process("pt", message.body);
            if (response.intent === "None" ) { //caso não encontre a intenção da mensagem
              await client.sendText(message.from, "Desculpa ainda estou aprendendo a lingua dos humanos 🙁");
              await client.sendText(message.from, "Tente falar com meu Criador humano");
              await client.sendLinkPreview(message.from, "https://wa.me/+5511000000000", "Contato do meu Humano");
            } else if(response.score <= 0.7) { //se não tiver muita certaza da resposta
              await client.sendText(message.from, response.answer);
              await client.sendText(message.from, "Não entendi muito direito se essa foi sua pergunta. \nCaso tenha respondido errado tente repetir de um jeito mais simples 😉");
            } else { //se tiver certeza da resposta
              await client.sendText(message.from, response.answer);
              //esse switch foi criada para algumas respostas peculiares ex: links, localização, figuras... 
              switch(response.intent) {
                case "SAUDAÇÃO":
                  await client.sendImageAsSticker(message.from, "./bot.jpg", "image-name", "caption text");
                  return;
                
                case "ENDEREÇO":
                  await client.sendText(message.from, "Rua tal no endereço tal, 390 \nCEP: 839392-993")
                  await client.sendLocation(message.from, '-13.6561589', '-69.7309264', 'Brasil');
                  return;

                case "ATENDENTE":
                  await client.sendLinkPreview(message.from, "https://wa.me/+5511000000000", "Contato do Atendente");
                  return;
              }
            }
          }
        });
      }
    }   
}

new bot().start();