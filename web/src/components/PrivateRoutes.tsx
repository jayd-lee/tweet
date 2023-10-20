import { gql, useQuery } from '@apollo/client';
import { Navigate, Outlet } from 'react-router-dom';

const IS_LOGGED_IN = gql`{
  me {
    id
  }
}`

const PrivateRoutes = () => {
  const { loading, error, data } = useQuery(IS_LOGGED_IN);
  if (loading) return <p>Loading...</p>
  if (error) return <p>{error.message}</p>
  return data.me ? <Outlet /> : <Navigate to='/login' />

}
 
export default PrivateRoutes;