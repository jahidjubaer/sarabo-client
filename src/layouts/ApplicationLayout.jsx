import { Outlet } from 'react-router';
import SupportWidget from '../components/support/SupportWidget';

function ApplicationLayout() {
    return (
        <>
            <Outlet />
            <SupportWidget />
        </>
    );
}

export default ApplicationLayout;
