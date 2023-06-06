import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/globals.scss';

import React from 'react';
import Home from "./components/home";
import { useMe } from './hooks/me';

import './App.css';


function App() {
  const { data, error, is_loading } = useMe();

  if (is_loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error</div>
  }

  if (!data?.home_folder_id) {
    return <div>User does not have home folder</div>;
  }

  return <Home home_folder_id={data?.home_folder_id} />
}

export default App;
