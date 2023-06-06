import { useState } from 'react';

import Layout from './layout';
import Commander from './commander/commander';
import Viewer from './viewer/viewer';

import { NodeClickArgsType } from 'types';


type Args = {
  home_folder_id: string;
}

function Home({ home_folder_id }: Args) {
  const [ node_id, set_node_id ] = useState(home_folder_id);
  const [ node_type, set_node_type ] = useState('folder');
  const [ page_number, set_page_number ] = useState(1);
  const [ per_page, set_per_page ] = useState(5);
  let component: JSX.Element;

  const onNodeClick = ({node_id, node_type}: NodeClickArgsType) => {
    console.log(`onNodeClick node_id=${node_id}, node_type=${node_type}`);
    set_node_id(node_id);
    set_node_type(node_type);
  }

  const onPageClick = (num: number) => {
    set_page_number(num);
  }

  const onPerPageChange = (num: number) => {
    set_per_page(num);
  }

  if (!node_id ) {
    return <div>Loading...</div>;
  }

  try {
    if (node_type == 'folder') {
      component = <Commander
        node_id={node_id}
        page_number={page_number}
        per_page={per_page}
        onNodeClick={onNodeClick}
        onPageClick={onPageClick}
        onPerPageChange={onPerPageChange}
      />
    } else {
      component = <Viewer node_id={node_id} onNodeClick={onNodeClick} />;
    }
  } catch(e) {
    component = <div>Caught exception</div>;
  }

  return (
    <Layout>
      {component}
    </Layout>
  );
}

export default Home;
