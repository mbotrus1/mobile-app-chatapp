import React, { useRef, useState } from 'react';
import './App.css';

import firebase from "firebase/compat/app";
import 'firebase/compat/firestore';
import "firebase/compat/auth";
import 'firebase/compat/analytics';
//import fire from "./fire.js" 
//import SplashScreen from './SplashScreen';

import {useAuthState, useCreateUserWithEmailAndPassword} from 'react-firebase-hooks/auth';
import {useCollectionData} from 'react-firebase-hooks/firestore';

firebase.initializeApp({
  apiKey: "AIzaSyAPc5niGGOEkqablnCQjyuNsQnkzqMPB1E",
  authDomain: "mobile-app-design-project-3.firebaseapp.com",
  projectId: "mobile-app-design-project-3",
  storageBucket: "mobile-app-design-project-3.appspot.com",
  messagingSenderId: "465330248752",
  appId: "1:465330248752:web:870a324b1b4d93e591a1f5",
  measurementId: "G-VPW5YFF6C4"

})

const auth = firebase.auth();
const firestore = firebase.firestore();
const analytics = firebase.analytics();


function App() {

  const [user] = useAuthState(auth);


  return (
    <div className="App">
      <header>
        <h1>⚛️🔥💬</h1>
        <SignOut />
      </header>

      <section>
        {user ? <Conversations /> : <SignIn />}
      </section>

    </div>
  );
}


function SignIn() {

  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  }

  return (
    <>
      <button className="sign-in" onClick={signInWithGoogle}>Sign in with Google</button>
      <p>Welcome to Maryam's Chat App Please be Nice!</p>
    </>
  )

}

function SignOut() {
  return auth.currentUser && (
    <button className="sign-out" onClick={() => auth.signOut()}>Sign Out</button>
  )
}

function Conversations()
{
  const dummy = useRef();
  const conversationsRef = firestore.collection('conversations');
  const query = conversationsRef.orderBy('createdAt').limit(25);
  const [formValue, setFormValue] = useState('');
  const [conversations] = useCollectionData(query, { idField: 'id' });
  const [showChatRoom, setShowChatRoom] = useState(null);
  const [conversationFilter, setConversationFilter] = useState('');
  const [showUserProfile, setShowUserProfile] = useState(null);

  const sendMessage = async (e) => {
    e.preventDefault();
    const { uid, photoURL } = auth.currentUser;

    

    await conversationsRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      user: auth.currentUser.email,
      uid,
      photoURL
    })
    setFormValue('');
    dummy.current.scrollIntoView({ behavior: 'smooth' });
  }

  return (<>
    <main>

      {showUserProfile && <div>
        <button onClick={() => {setShowUserProfile(null)}}>BACK</button>
        <UserProfilePage user={showUserProfile} />
        </div>}

      <input placeholder='Filter...' value={conversationFilter} onChange={evt => {setConversationFilter(evt.target.value)}} />

      {(conversations && !showChatRoom) && conversations.filter(con => con.user.indexOf(conversationFilter)>=0).map(msg => <MyConversations key={msg.id} conversations={msg} 
        showChatRoom={showChatRoom} setShowChatRoom={setShowChatRoom} 
        setShowUserProfile={setShowUserProfile}/>)}

      {showChatRoom && 
        <div>
          <button onClick={() => {setShowChatRoom(null)}}>BACK</button>
          <ChatRoom conversationName={showChatRoom} />
        </div>
      }

      <span ref={dummy}></span>

    </main>

    {(!showChatRoom) && <form onSubmit={sendMessage}>

      <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="Start a New Conversation" />

      <button type="submit" disabled={!formValue}>🕊️</button>

    </form>}
  </>)

}

function UserProfilePage(props) {

  const {user} = props;

  const conversationsRef = firestore.collection('conversations');
  const query = conversationsRef.orderBy('createdAt').limit(25);
  const [conversations] = useCollectionData(query, { idField: 'id' });

  const scores = (conversations||[]).filter(con => (con.user==user && con.starRating)).map(con => con.starRating);
  const starTotal = scores.length>0 ? scores.reduce((s,v) => s+v) : 0;
  const avgRating = starTotal/Math.max(1, scores.length);

  return <div>
    <p>{user}</p>
    <div>
      <p class='inlineBlock'> </p>
      <p class='inlineBlock'>{'★'}</p>
      <p class='inlineBlock'>{avgRating>1 ? '★' : '☆'}</p>
      <p class='inlineBlock'>{avgRating>2 ? '★' : '☆'}</p>
      <p class='inlineBlock'>{avgRating>3 ? '★' : '☆'}</p>
      <p class='inlineBlock'>{avgRating>4 ? '★' : '☆'}</p>
    </div>
  </div>

}

function MyConversations(props) {
  const { text, uid, photoURL, user } = props.conversations;
  const {showChatRoom, setShowChatRoom, setShowUserProfile} = props;

  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

  return (<>
    <div className={`message ${messageClass}`}>
      <img src={photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png'} />
      {(!showChatRoom) && <button onClick={() => setShowChatRoom(text)}>{text} </button>}
      <p onClick={() => {setShowUserProfile(user)}}> {user} </p>
    </div>
  </>)
}

function ChatRoom(props) {

  const {conversationName} = props;

  //const chat_name = text;
  const dummy = useRef();
  const messagesRef = firestore.collection('messages');
  const query = messagesRef.orderBy('createdAt').limit(25);

  console.log(query.get().catch(err => {
    console.log('???');
    console.log(err);
  }));

  const [messages] = useCollectionData(query, { idField: 'id' });

  console.log('ESSAGES');
  console.log(messages);
  console.log(conversationName);

  const [formValue, setFormValue] = useState('');


  const sendMessage = async (e) => {
    e.preventDefault();

    const { uid, photoURL } = auth.currentUser;

    await messagesRef.add({
      text: formValue,
      conversation: conversationName,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL
    })

    setFormValue('');
    dummy.current.scrollIntoView({ behavior: 'smooth' });
  }

  return (<>
    <main>

      <StarBar conversationName={conversationName} />

      {messages && messages.filter(msg => msg.conversation==conversationName).map(msg => <ChatMessage key={msg.id} message={msg} />)}

      <span ref={dummy}></span>

    </main>

    <form onSubmit={sendMessage}>

      <input value={formValue} onChange={(e) => setFormValue(e.target.value)} placeholder="say something nice" />

      <button type="submit" disabled={!formValue}>🕊️</button>

    </form>
  </>)
}

function StarBar(props) {

  const [starRating, setStarRating] = useState(null);

  const conversationsRef = firestore.collection('conversations');
  const query = conversationsRef.orderBy('createdAt').limit(25);
  const [conversations] = useCollectionData(query, { idField: 'id' });

  let saveStarRating = (star) => {
    var id = conversations.filter(con => con.text==props.conversationName)[0].id;
    conversationsRef.doc(id).update({starRating: star});
    setStarRating(star);
  }

  return (
    <div>
      <p class='inlineBlock' onClick={() => saveStarRating(0)}> </p>
      <p class='inlineBlock' onClick={() => saveStarRating(1)}>{'★'}</p>
      <p class='inlineBlock' onClick={() => saveStarRating(2)}>{starRating>1 ? '★' : '☆'}</p>
      <p class='inlineBlock' onClick={() => saveStarRating(3)}>{starRating>2 ? '★' : '☆'}</p>
      <p class='inlineBlock' onClick={() => saveStarRating(4)}>{starRating>3 ? '★' : '☆'}</p>
      <p class='inlineBlock' onClick={() => saveStarRating(5)}>{starRating>4 ? '★' : '☆'}</p>
    </div>
  );

}


function ChatMessage(props) {
  const { text, uid, photoURL } = props.message;

  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

  return (<>
    <div className={`message ${messageClass}`}>
      <img src={photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png'} />
      <p>{text}</p>
    </div>
  </>)
}


export default App;