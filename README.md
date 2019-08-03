# Stockfish 1x1 
<div align="center">
  <a href="https://www.youtube.com/embed/odQZWNiWH5A"><img src="https://i9.ytimg.com/vi/odQZWNiWH5A/mq1.jpg?sqp=CLz9luoF&rs=AOn4CLBh-QVoAzF9m3sdP1NgIQV2jfVKKA" alt=""></a>
</div>

### **Objetivo**  
* Povoar uma base [mongodb](https://www.mongodb.com) com partidas de Xadrez geradas a partir do confronto de duas engines [stockfish](https://stockfishchess.org/).  
  
  
  
### **Como usar**  
Instale o NodeJS, o MongoDB e em seguida povoe a base de dados _chess_:
* mongoimport --db chess --collection mateinns <_path to mateinns.json_>/mateinns.json  
* mongoimport --db chess --collection mateinns <_path to bestmoves.json_>/bestmoves.json  
* mongoimport --db chess --collection mateinns <_path to pgns.json_>/pgns.json  

* _node permanencia.js_  
* _node server.js_  
* _localhost:8080_
