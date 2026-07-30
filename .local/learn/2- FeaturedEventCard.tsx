// Users is a icon from lucide-react
// lucide-react is a library of icons for react

// then we import useTranslation from react-i18next for translations

// then we import Button from ../shared/Button to as a component

// then we import Badge from ../shared/Badge to as a component

// then we import the default event image source and the resolveMediaUrl function from the utils/media.ts file
// default event image source is the image that will be displayed if the event image is not found
// resolveMediaUrl is a function that will resolve the media url, by resolving the media we mean to get the media url from the media object




import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../shared/Button";
import { Badge } from "../shared/Badge";
import {
  DEFAULT_EVENT_IMAGE_SRC,
  resolveMediaUrl,
} from "../../utils/media";



// first we define the props for the FeaturedEventCard component
// number in react is equivalent to integer in javascript, the difference is that in react we use number instead of int
// onJoin is an optional prop, it is a function that will be called when the user clicks the join button
// ? means it is optional
// : means it is a type
// () => void means a function that returns nothing
// so totaly onJoin?: () => void means onJoin is an optional prop that is a function that returns nothing
// so later if we call the FeaturedEventCard component, we pass onJoin like this: <FeaturedEventCard onJoin={() => {}} />
// className?: string means className is an optional prop that is a string, like className="bg-red-500"

type FeaturedEventCardProps = {
  image: string;
  title: string;
  description: string;
  levelLabel: string;
  memberCount: number;
  onJoin?: () => void;
  className?: string;
};


// here we define a function that returns a UI component
// the name of the component is FeaturedEventCard
// { image, title, description, levelLabel, memberCount, onJoin, className = "" } are the props for this component
// : FeaturedEventCardProps means the when we call the component, it must pass the props we defined above in the correct  type.
// const {t} means we are making a function call t, we can call it like t("discover.featuredClub") to get the translation for the key "discover.featuredClub"
// useeTranslation() is a function that returns a function, so now whenever we call t, its like calling useTranslation() 
// we also define a variable called imageUrl and store the result of the resolveMediaUrl function call in it
// resolveMediaUrl(image, DEFAULT_EVENT_IMAGE_SRC) will return the url of the image.


export function FeaturedEventCard({
  image,
  title,
  description,
  levelLabel,
  memberCount,
  onJoin,
  className = "",
}: FeaturedEventCardProps) {
  const { t } = useTranslation();
  const imageUrl = resolveMediaUrl(image, DEFAULT_EVENT_IMAGE_SRC);


// <article> is a html tag that is used to create a article or a section of a page
// className={`relative min-h-[320px] overflow-hidden rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] ${className}`} is a tailwind css class
// min-h-[320px] means the minimum height of the article is 320px
// overflow-hidden means the overflow of the article is hidden
// rounded-3xl means the border radius of the article is 3xl
// shadow-[0_4px_20px_rgba(0,0,0,0.04)] means the shadow of the article is 0 4px 20px rgba(0,0,0,0.04)
// ${className} means the className of the article is the className we passed to the component, like className="bg-red-500"
// so other that classes we pass as tailwind css classes, it receives the className we passed to the component as extra classes

// <div> is a html tag that is used to create a div or a container of a page
// className="absolute inset-0 bg-cover bg-center" is a tailwind css class
// inset-0 means the div is 0 from the top, 0 from the right, 0 from the bottom, 0 from the left
// bg-cover means the background image is cover, so it will cover the entire div
// bg-center means the background image is centered

// style is a javascript object that is used to pass styles to the div
// backgroundImage: `url('${imageUrl}')` means the background image of the div is the imageUrl

// <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" /> is a div with a gradient background
// absolute means the div is positioned absolutely, so it will be positioned relative to the parent div
// inset-x-0 means the div is 0 from the left and 0 from the right of the parent div
// bg-gradient-to-t means the background image is a gradient from the top to the bottom
// from-black/60 means the gradient starts from black with 60% opacity
// to-transparent means the gradient ends with transparent
// so this div is a div with a gradient background from the top to the bottom
// so this div is the top of the article


// <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-white/10 p-8 backdrop-blur-xl"> is a div with a backdrop blur background
// inset-x-0 means the div is 0 from the left and 0 from the right
// bottom-0 means the div is at the bottom of the page
// border-t means the top border of the div is a white border
// border-white/10 means the top border of the div is a white border with 10% opacity
// bg-white/10 means the background color of the div is a white color with 10% opacity
// p-8 means the padding of the div is 8px
// backdrop-blur-xl means the backdrop of the div is blurred with 1px blur
// so this div is a div with a backdrop blur background and a white border on the top
// so this div is the bottom of the article

// div className="mb-4 flex flex-wrap gap-2"> is a div with a margin bottom of 4px and a flex wrap gap of 2px
// flex-wrap means the flex items will wrap to the next line if they don't fit in the same line
// gap-2 means the gap between the flex items is 2px
// so this div is a div with a margin bottom of 4px and a flex wrap gap of 2px
// so this div is the top of the article

// <Badge>{t("discover.featuredClub")}</Badge> is a badge with a translation for the key "discover.featuredClub"
// <Badge>{levelLabel}</Badge> is a badge with the level label

  return (
    <article
      className={`relative min-h-[320px] overflow-hidden rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] ${className}`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${imageUrl}')` }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-white/10 p-8 backdrop-blur-xl">
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge>{t("discover.featuredClub")}</Badge>
          <Badge>{levelLabel}</Badge>
        </div>

        <h3 className="mb-2 font-display text-2xl font-semibold text-white">
          {title}
        </h3>

        <p className="mb-6 text-sm text-white/80">{description}</p>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button variant="secondary" onClick={onJoin}>
            {t("discover.joinGroup")}
          </Button>

          <div className="flex items-center gap-2 text-sm text-white/90">
            <Users size={18} aria-hidden="true" />
            <span>{t("discover.members", { count: memberCount })}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
