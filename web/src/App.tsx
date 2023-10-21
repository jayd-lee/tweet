import { ApolloClient, ApolloProvider,  HttpLink,  InMemoryCache } from '@apollo/client'
import './App.css'
import Users from './components/Users';
import { Route, Routes } from 'react-router-dom';
import Landing from './components/Landing';
import { setContext } from 'apollo-link-context';
import Signup from './pages/Signup';
import Login from './pages/Login';
import PrivateRoutes from './components/PrivateRoutes';
import Profile from './pages/Profile';


const httpLink = new HttpLink({
  uri: import.meta.env.VITE_BACKEND
})
const authLink = setContext(async(req, {headers}) => {
  const token = localStorage.getItem('token')
  return {
    ...headers,
    headers: {
      Authorization: token ? `Bearer ${token}` : null
    }
  }
})

const link = authLink.concat(httpLink as any)
const client = new ApolloClient({
  link: (link as any),
  cache: new InMemoryCache()
})


function App() {

  return (
    <ApolloProvider client={client}>
      <Routes>        
        <Route element={<PrivateRoutes/>} >
          <Route path="/users" element={<Users/>} />
          <Route path="/profile" element={<Profile/>} />

        </Route>

        <Route path="/landing" element={<Landing />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />


      </Routes>
    </ApolloProvider>
  )
}

export default App;
