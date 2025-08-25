interface ProfileCardProps {
  image: string;
  title: string;
  subtitle: string;
  country: string;
  itemRef?: any;
}

const ProfileCard = ({ image, title, subtitle, country }: ProfileCardProps) => {
  return (
    <div className="w-fit w-min-[200px] bg-gray-50 p-2 rounded-lg m-2 flex-shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{title}</div>
          <div className="text-xs text-gray-500">{subtitle}</div>
          <div className="text-xs text-blue-600">{country}</div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard; 