import { gql, useQuery } from '@apollo/client';

const USERS_QUERY=gql`
query USERS_QUERY {
  allUsers {
    id
    name
  }
}
`
interface User {
  name: string
}

const users = () => {
  const {loading, error, data} = useQuery(USERS_QUERY)
  if (loading) return <p>Loading...</p>
  if (error) return <p>{error.message}</p>

  return ( 
  <div>
    {data.allUsers.map((user: User) => <p>{user.name}</p>)}
  </div> 
  );
}
 
export default users;