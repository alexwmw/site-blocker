import {
  BriefcaseBusiness,
  Camera,
  Cloud,
  Gamepad2,
  Image,
  MessageCircleMore,
  Music4,
  Newspaper,
  Play,
  ShoppingBag,
  Sparkles,
  Tv,
  Users,
  type LucideIcon,
} from 'lucide-react';

import type { PopularSiteIcon as PopularSiteIconToken } from '@/types/schema';

const ICON_MAP: Record<PopularSiteIconToken, LucideIcon> = {
  briefcase: BriefcaseBusiness,
  camera: Camera,
  cloud: Cloud,
  gamepad: Gamepad2,
  image: Image,
  messages: MessageCircleMore,
  music: Music4,
  newspaper: Newspaper,
  play: Play,
  'shopping-bag': ShoppingBag,
  sparkles: Sparkles,
  tv: Tv,
  users: Users,
};

type PopularSiteIconProps = {
  icon: PopularSiteIconToken;
  className?: string;
};

const PopularSiteIcon = ({ icon, className }: PopularSiteIconProps) => {
  const Icon = ICON_MAP[icon];

  return (
    <Icon
      aria-hidden='true'
      className={className}
      size={18}
      strokeWidth={2}
    />
  );
};

export default PopularSiteIcon;
