import { Outlet } from 'react-router-dom';

const ProtectedAreasSectionPage = () => {
  return (
    <div className="pb-2">
      <Outlet />
    </div>
  );
};

export default ProtectedAreasSectionPage;
