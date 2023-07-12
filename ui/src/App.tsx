import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'styles/globals.scss';

import React, { useState } from 'react';
import SpecialFolder from "components/special_folder";
import Tags from "components/tags/table"
import Layout from 'components/layout';
import { useMe } from 'hooks/me';
import { SidebarItem } from 'types';


import 'App.css';


function App() {
  const { data, error, is_loading } = useMe();
  const [sidebar_item, setSidebarItem] = useState<SidebarItem>(SidebarItem.home);

  const onSidebarItemChange = (item: SidebarItem) => {
    setSidebarItem(item);
  }
  let content_block: JSX.Element;

  if (is_loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error</div>
  }

  if (!data?.home_folder_id) {
    return <div>User does not have home folder</div>;
  }

  if (sidebar_item == SidebarItem.home) {
    content_block = <SpecialFolder special_folder_id={ data?.home_folder_id } />;
  } else if (sidebar_item == SidebarItem.inbox) {
    content_block = <SpecialFolder special_folder_id={ data?.inbox_folder_id } />;
  } else {
    content_block = <Tags />;
  }

  return (
    <Layout onSidebarItemChange={onSidebarItemChange}>
      {content_block}
    </Layout>
  );
}

export default App;
