// material-ui

/**
 * if you want to use image instead of <svg> uncomment following.
 *
 * const logoIconDark = 'assets/images/logo-icon-dark.svg';
 * const logoIcon = 'assets/images/logo-icon.svg';
 * import { ThemeMode } from 'config';
 */

// ==============================|| LOGO ICON IMAGE ||============================== //

export default function LogoIcon() {

  const logoIcon = 'assets/images/XDemand-XOnly.png';

  return (
    /**
     * if you want to use image instead of svg uncomment following, and comment out <svg> element.
     *
     * <img src={theme.palette.mode === ThemeMode.DARK ? logoIconDark : logoIcon} alt="Mantis" width={129} height={129} />
     *
     */
    <img src={logoIcon} alt="Logo" width={80} height={80} />
  );
}