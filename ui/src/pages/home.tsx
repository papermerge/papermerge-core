import { useEffect, useState } from 'react';
import Head from "next/head";
import Layout from '../components/layout';
import Commander from '../components/commander/commander';

import { useUser } from "@/contexts/user";


function Home() {
  const user_context = useUser();
  const [ node_id, set_node_id ] = useState('');
  const [ page_number, set_page_number ] = useState(1);
  const [ per_page, set_per_page ] = useState(5);

  useEffect( () => {
    if (!node_id) {
      set_node_id(user_context.user?.home_folder_id || '');
    }
  }, [user_context.user]);

  const onNodeClick = (node_id: string) => {
    set_node_id(node_id);
  }

  const onPageClick = (num: number) => {
    set_page_number(num);
  }

  const onPerPageChange = (num: number) => {
    set_per_page(num);
  }

  if (!node_id ) {
    return <div>Loading...{user_context.user?.username} {user_context.user?.home_folder_id}</div>;
  }

  return (
    <Layout>
      <Head>
        <title>Home</title>
      </Head>
      <Commander
        node_id={node_id}
        page_number={page_number}
        per_page={per_page}
        onNodeClick={onNodeClick}
        onPageClick={onPageClick}
        onPerPageChange={onPerPageChange} />
    </Layout>
  );
}

export default Home;
