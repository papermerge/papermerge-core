import styles from "./breadcrumb.module.scss";
import BreadcrumbItem from "./item";
import Spinner from "../spinner";
import SpinnerPlaceholder from "../spinner_placeholder";

type Args = {
  path: Array<[string, string]>;
  onClick: (node_id: string) => void;
  is_loading: boolean;
}

export default function Breadcrumb({path, onClick, is_loading}: Args) {
  let breadcrumb_items = path.map((item: [string, string]) => {
    return <BreadcrumbItem
      node_id={item[0]}
      node_title={item[1]}
      onClick={onClick}
    />
  });

  return (
    <ul className={styles.breadcrumb}>
      {is_loading ? <Spinner />: <SpinnerPlaceholder />}
      {breadcrumb_items}
    </ul>
  );
}
