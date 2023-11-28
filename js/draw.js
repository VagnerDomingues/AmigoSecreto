
axios.defaults.headers.common['Content-Type'] = "application/x-www-form-urlencoded";
axios.defaults.headers.common['x-collection-access-token'] = "ceb87fbf-1614-45d2-b09a-4134300c01d1";

var participants = [];
var draw = [];

function getUrl(){
	const url = 'https://api.myjson.online/v1/records';
	return url;
}
https://api.myjson.online/v1/records/
function getUrisParticipants(){
	return [
		`ab73dd6e-02f3-4615-8b62-24b85c7f7cd3`,
		`247355b2-f9a1-4ad3-aaf4-ff9edeaa334e`,
		`b0d7088c-ed7b-43d7-8b8a-0391e9e79e67`,
		`de4e8611-5d9a-4269-a93b-b28e7e3979e1`,
		`d2f446f7-75a2-46e5-acb8-56635392fecf`,
	];
}

function getUrisDraw(){
	return [
		`c7cf6091-febf-4ba0-a0b3-3390b7a840b3`,
		`af6c3ffa-4d3c-41ab-baa8-ec36e8a5e94d`,
		`a3bf2b1f-1341-44bc-97a9-d50a050fc4c0`,
		`6ce4cc52-4c75-4681-b998-21b70a4df9e9`,
		`8671c7ee-d63f-4e21-9418-d41fdb5d6c44`
	];
}

async function getPromises(uris){
	const url = getUrl();
	const promises = [];

	uris.forEach(uri => {
		console.log(`${url}/${uri}`)
		promises.push(axios.get(`${url}/${uri}`));
	});
	await Promise.all(promises);
	return promises;
}

async function getParticipants(){
	const uris = getUrisParticipants();
	const promises = await getPromises(uris);
	promises.forEach(promise => {
		promise.then((response) => {
			participants.push(response.data);
		})
	});

}

async function getDraw(){
	const uris = getUrisDraw();
	const promises = await getPromises(uris);
	promises.forEach(promise => {
		promise.then((response) => {
			draw.push(response.data);
		})
	});
}

async function goToHome(user){
	const drawn = await drawFriend(user.data.id);
	console.log('drawn:')
	console.log(drawn)


	localStorage.setItem("name", user.data.name);


	console.log('name:')
	console.log(user.data.name)
	localStorage.setItem("drawn", getParticipantByHash(drawn.data.idDrawn).data.name);

	console.log('drawn ID:')
	console.log(getParticipantByHash(drawn.data.idDrawn).data.name)

	window.location.href = "home.html";
}

async function savePassword(user){
	const url = getUrl();
	console.log('saving')
	console.log(`${url}/${user.id}?${JSON.stringify(user.data)}`)
	await axios.put(`${url}/${user.id}`, { jsonData: JSON.stringify(user.data)}  );
}

async function login() {
	const name = document.getElementById("name").value;
	const passwordForm = document.getElementById("password").value;
	const user = getParticipantByName(name);
	if(user){
		if (passwordForm === '') {
			alert('Informe uma senha!');
		}else{
			if(user.data.password === ''){
				user.data.password = passwordForm;
				await savePassword(user)
				console.log('saved')
				goToHome(user);
			}else{
				if(user.data.password === passwordForm){
					goToHome(user);
				}else{
					alert('Senha incorreta!')
				}
			}
		}
	}else{
		alert('Usuário não encontrado!');
	}
}

async function isLogged(){
	if(localStorage.getItem("name")){
		const welcome = document.getElementById('welcome');
		welcome.appendChild(document.createTextNode(localStorage.getItem("name") + ','));
		const message = document.getElementById('message');
		message.appendChild(document.createTextNode('Seu amigo secreto é:'))
		const friend = document.getElementById('friend');
		friend.appendChild(document.createTextNode(localStorage.getItem("drawn")))
	}else{
		logout();
	}
}

function logout(){
	localStorage.clear();
	window.location.href = "index.html";
}

async function drawFriend(id){
	const url = getUrl();
	const drawn = isInDraw(id);
	console.log(drawn)
	if(drawn.data.idDrawn == ''){
		console.log(id)
		console.log('filtrando')
		const candidates =  filterCandidates(id);
		console.log(candidates)
		console.log('aleatoriamente')
		const randomDrawn = randomParticipant(candidates);
		console.log(randomDrawn)
		await axios.put(`${url}/${drawn.id}`,{ jsonData: 
			JSON.stringify({
				idParticipant: id,
				idDrawn : randomDrawn.id
			})
		}
		);
		const participant = getParticipantById(randomDrawn.data.id);
		console.log('participante por id: ')
		console.log(participant)
		participant.data.drawn = true;
		await axios.put(`${url}/${participant.id}`, { jsonData: JSON.stringify(participant.data)} );
		draw.forEach(item => {
			if(item.data.idParticipant == id) item.data.idDrawn = randomDrawn.id;
		});
	}
	return drawn;
}

function isInDraw(id){
	return draw.find(item => item.data.idParticipant == id);
}

function wasDrawn(id){
	return draw.find(item => item.data.idDrawn == id);
}

function getParticipantById(id){
	return participants.find(participant => participant.data.id == id);
}

function getParticipantByHash(id){
	return participants.find(participant => participant.id == id);
}

function getParticipantByName(name){
	console.log('participante selecionado : ' + participants.find(participant => participant.data.name == name).data.name)
	return participants.find(participant => participant.data.name == name);
}

function randomParticipant(candidates) {
	console.log('selecionando candidatos:')
	console.log(candidates)
    let min = Math.ceil(0);
    let max = Math.floor(candidates.length -1);
    let index = Math.floor(Math.random() * (max - min + 1)) + min;
    return candidates[index];
}

function filterCandidates(id){
	const withOutParticipant = participants.filter(person => person.data.id != id);
	const theUnaffected = withOutParticipant.filter(person => !person.data.drawn);
	const presenter = wasDrawn(id);
	console.log(presenter)
	if(presenter){
		return theUnaffected.filter(person => person.data.id != presenter.data.id);
	}
	console.log(theUnaffected)
	return theUnaffected;
}
