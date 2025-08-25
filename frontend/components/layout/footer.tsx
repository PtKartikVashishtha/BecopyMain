const Footer = () => {
  return (
    <div className="w-full h-auto sm:h-auto flex flex-col sm:flex-row place-items-center justify-center p-2 sm:p-0">
      <p className="text-sm sm:text-md text-[#0284DA] text-center">&copy; {new Date().getFullYear()} Programmer Community. All rights reserved.</p>
    </div>
  )
}

export default Footer;