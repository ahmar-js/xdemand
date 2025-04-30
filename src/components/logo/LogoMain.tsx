'use client';

// material-ui


// project-import


/**
 * if you want to use image instead of <svg> uncomment following.
 *
 * const logoDark = 'assets/images/logo-dark.svg';
 * const logo = 'assets/images/logo.svg';
 *
 */

// ==============================|| LOGO SVG ||============================== //

export default function LogoMain({ reverse }: { reverse?: boolean }) {
  
  const logoIcon = 'assets/images/XDemand-SpaceAbove.png';

  return (
    /**
     * if you want to use image instead of svg uncomment following, and comment out <svg> element.
     *
     * <Image src={theme.palette.mode === ThemeMode.DARK ? logoIconDark : logoIcon} alt="Mantis" width={129} height={129} />
     *
     */
    <img src={logoIcon} width={140} height={100} />
  );
}
