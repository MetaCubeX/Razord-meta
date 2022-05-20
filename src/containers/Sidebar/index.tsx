import classnames from 'classnames'
import { NavLink, useLocation } from 'react-router-dom'

import logo from '@assets/logo.png'
import { Lang, Language } from '@i18n'
import { useI18n, useVersion, useClashXData } from '@stores'
import './style.scss'

interface SidebarProps {
    routes: Array<{
        path: string
        name: string
        noMobile?: boolean
    }>
}

export default function Sidebar (props: SidebarProps) {
    const { routes } = props
    const { translation } = useI18n()
    const { version, premium, meta } = useVersion()
    const { data } = useClashXData()
    const { t } = translation('SideBar')
    const location = useLocation()

    const navlinks = routes.map(
        ({ path, name, noMobile }) => (
            <li className={classnames('item', { 'no-mobile': noMobile })} key={name}>
                <NavLink to={{ pathname: path, search: location.search }} className={({ isActive }) => classnames({ active: isActive })}>
                    { t(name as keyof typeof Language[Lang]['SideBar']) }
                </NavLink>
            </li>
        ),
    )

    return (
        <div className="sidebar">
            <img src={logo} alt="logo" className="sidebar-logo" />
            <ul className="sidebar-menu">
                { navlinks }
            </ul>
            <div className="sidebar-version">
                <span className="sidebar-version-label">Clash{ data?.isClashX && 'X' } { t('Version') }</span>
                <span className="sidebar-version-text">{ version }</span>
                { meta && <span className="sidebar-version-label">Meta</span> }
            </div>
        </div>
    )
}
