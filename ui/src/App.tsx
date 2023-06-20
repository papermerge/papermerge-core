import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/globals.scss';

import React, { useState } from 'react';
import Home from "./components/home";
import { useMe } from './hooks/me';
import type { SpecialFolder } from 'types';

import './App.css';


function App() {
  const { data, error, is_loading } = useMe();
  const [currentSpecialFolder, setCurrentSpecialFolder] = useState<SpecialFolder>("home");

  const onSpecialFolderChange = (folder: SpecialFolder) => {
    setCurrentSpecialFolder(folder);
  }

  if (is_loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error</div>
  }

  if (!data?.home_folder_id) {
    return <div>User does not have home folder</div>;
  }

  return (
    <Home
      special_folder_id={currentSpecialFolder === "home" ? data?.home_folder_id : data?.inbox_folder_id}
      onSpecialFolderChange={onSpecialFolderChange} />
  );
}

export default App;
