import classnames from 'classnames'
import { Route, Navigate, Routes, useLocation, Outlet } from 'react-router-dom'

// import Overview from '@containers/Overview'
import Connections from '@containers/Connections'
import ExternalControllerModal from '@containers/ExternalControllerDrawer'
import Logs from '@containers/Logs'
import Proxies from '@containers/Proxies'
import Rules from '@containers/Rules'
import Settings from '@containers/Settings'
import SideBar from '@containers/Sidebar'
import { isClashX } from '@lib/jsBridge'
import { useLogsStreamReader } from '@stores'

import '../styles/common.scss'
import '../styles/iconfont.scss'

export default function App () {
    useLogsStreamReader()

    const location = useLocation()

    const routes = [
    // { path: '/', name: 'Overview', component: Overview, exact: true },
        { path: '/proxies', name: 'Proxies', element: <Proxies /> },
        { path: '/logs', name: 'Logs', element: <Logs /> },
        { path: '/rules', name: 'Rules', element: <Rules />, noMobile: false },
        { path: '/connections', name: 'Connections', element: <Connections />, noMobile: false },
        { path: '/settings', name: 'Settings', element: <Settings /> },
    ]

    const layout = (
        <div className={classnames('app', { 'not-clashx': !isClashX() })}>
            <SideBar routes={routes} />
            <div className="page-container">
                <Outlet />
            </div>
            <ExternalControllerModal />
        </div>
    )

    return (
        <Routes>
            <Route path="/" element={layout}>
                <Route path="/" element={<Navigate to={{ pathname: '/proxies', search: location.search }} replace />} />
                {
                    routes.map(
                        route => <Route path={route.path} key={route.path} element={route.element} />,
                    )
                }
            </Route>
        </Routes>
    )
}
