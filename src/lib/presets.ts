export interface Preset {
	name: string;
	description: string;
	fragment: string;
}

export interface Category {
	id: string;
	label: string;
	template: string;
	presets: Preset[];
}

export const categories: Category[] = [
	{
		id: 'outfits',
		label: 'Outfits',
		template: 'Dress the character in {}.',
		presets: [
			{
				name: 'Bunny outfit',
				description: 'Playful bunny-themed costume with ears and fluffy tail',
				fragment:
					'a cute bunny outfit: white fluffy bodysuit, pink inner-ear bunny ear headband, fluffy cotton tail, and pink ballet flats'
			},
			{
				name: 'Swimsuit',
				description: 'Cute swimsuit',
				fragment: 'a cute swimsuit'
			},
			{
				name: 'Classic tuxedo',
				description: 'Sharp black-tie formal wear',
				fragment:
					'a classic black tuxedo: white dress shirt, black bow tie, black jacket with satin lapels, black trousers, and polished black oxford shoes'
			},
			{
				name: 'Astronaut suit',
				description: 'Full NASA-style space suit',
				fragment:
					'a white NASA-style astronaut space suit with helmet visor up, mission patches on the arms, and bulky space boots'
			},
			{
				name: 'Pirate captain',
				description: 'Swashbuckling pirate captain look',
				fragment:
					'a pirate captain outfit: tricorn hat, long red coat with gold trim, white ruffled shirt, brown leather belt with gold buckle, black boots, and an eyepatch'
			},
			{
				name: 'Summer beach',
				description: 'Relaxed tropical beach outfit',
				fragment:
					'a summer beach outfit: colorful Hawaiian shirt unbuttoned over a white tank top, khaki shorts, flip flops, and aviator sunglasses'
			},
			{
				name: 'Medieval knight',
				description: 'Full plate armor with cape',
				fragment:
					'full medieval plate armor: steel breastplate, chainmail underneath, gauntlets, greaves, a red cape, and a plumed great helm held under one arm'
			},
			{
				name: 'Cyberpunk',
				description: 'Neon-accented futuristic streetwear',
				fragment:
					'cyberpunk streetwear: black leather jacket with glowing neon blue trim, mirrored visor glasses, tactical cargo pants, chunky platform boots, and holographic accessories'
			},
			{
				name: '1920s flapper',
				description: 'Roaring twenties glamour',
				fragment:
					'a 1920s flapper outfit: fringed sequin dress in gold, long pearl necklace, feathered headband, T-strap heels, and a cigarette holder'
			}
		]
	},
	{
		id: 'hats',
		label: 'Hats',
		template: "Put {} on the character's head.",
		presets: [
			{
				name: 'Top hat',
				description: 'Classic tall black silk hat',
				fragment: 'a classic tall black silk top hat'
			},
			{
				name: 'Cowboy hat',
				description: 'Wide-brimmed western leather hat',
				fragment: 'a brown leather wide-brimmed cowboy hat'
			},
			{
				name: 'Crown',
				description: 'Golden royal crown with jewels',
				fragment: 'a golden royal crown encrusted with rubies and sapphires'
			},
			{
				name: 'Baseball cap',
				description: 'Casual snapback cap',
				fragment: 'a red baseball snapback cap'
			},
			{
				name: 'Witch hat',
				description: 'Tall pointed black witch hat',
				fragment: 'a tall pointed black witch hat with a wide brim'
			},
			{
				name: 'Viking helmet',
				description: 'Iron helmet with curved horns',
				fragment: 'an iron Viking helmet with two curved horns'
			},
			{
				name: 'Beret',
				description: 'Classic French artist beret',
				fragment: 'a classic black French artist beret tilted to one side'
			},
			{
				name: 'Sombrero',
				description: 'Wide colorful Mexican sombrero',
				fragment: 'a wide colorful Mexican sombrero with decorative embroidery'
			}
		]
	},
	{
		id: 'expressions',
		label: 'Expressions',
		template: "Change the character's expression to {}.",
		presets: [
			{
				name: 'Happy',
				description: 'Bright cheerful smile',
				fragment: 'a bright cheerful smile with sparkling eyes'
			},
			{
				name: 'Angry',
				description: 'Fierce scowl',
				fragment: 'an angry scowl with furrowed brows and clenched jaw'
			},
			{
				name: 'Surprised',
				description: 'Wide-eyed shock',
				fragment: 'a surprised look with wide eyes and open mouth'
			},
			{
				name: 'Sad',
				description: 'Tearful and downcast',
				fragment: 'a sad expression with downcast eyes and a slight frown'
			},
			{
				name: 'Smug',
				description: 'Self-satisfied smirk',
				fragment: 'a smug smirk with half-lidded eyes and a raised eyebrow'
			},
			{
				name: 'Wink',
				description: 'Playful wink',
				fragment: 'a playful wink with one eye closed and a slight smile'
			},
			{
				name: 'Determined',
				description: 'Focused and resolute',
				fragment: 'a determined look with set jaw and focused, intense eyes'
			},
			{
				name: 'Sleepy',
				description: 'Drowsy and half-asleep',
				fragment: 'a sleepy expression with drooping eyelids and a yawn'
			}
		]
	},
	{
		id: 'poses',
		label: 'Poses',
		template: 'Change the character to {}.',
		presets: [
			{
				name: 'Peace sign',
				description: 'Flashing a V-sign',
				fragment: 'a pose flashing a peace sign with one hand near their face'
			},
			{
				name: 'Arms crossed',
				description: 'Confident stance with crossed arms',
				fragment: 'a confident stance with arms crossed over their chest'
			},
			{
				name: 'Hands on hips',
				description: 'Power pose',
				fragment: 'a power pose with both hands on their hips'
			},
			{
				name: 'Waving',
				description: 'Friendly wave',
				fragment: 'a friendly wave with one hand raised'
			},
			{
				name: 'Sitting',
				description: 'Relaxed seated position',
				fragment: 'a relaxed sitting position'
			},
			{
				name: 'Jumping',
				description: 'Mid-air leap',
				fragment: 'a dynamic mid-air jump with arms spread wide'
			},
			{
				name: 'Thinking',
				description: 'Hand on chin, pondering',
				fragment: 'a thinking pose with one hand on their chin'
			},
			{
				name: 'Dabbing',
				description: 'The classic dab',
				fragment: 'a dabbing pose with one arm extended and face tucked into the other elbow'
			}
		]
	},
	{
		id: 'backgrounds',
		label: 'Backgrounds',
		template: 'Change the background to {}.',
		presets: [
			{
				name: 'Tropical beach',
				description: 'Sandy shore with palm trees and turquoise water',
				fragment:
					'a tropical beach scene: white sandy shore, swaying palm trees, crystal clear turquoise water, and a bright blue sky with fluffy clouds'
			},
			{
				name: 'City skyline',
				description: 'Urban rooftop at golden hour',
				fragment:
					'a city skyline view from a rooftop at golden hour: tall skyscrapers silhouetted against a warm orange and pink sunset sky'
			},
			{
				name: 'Enchanted forest',
				description: 'Magical woodland with glowing lights',
				fragment:
					'an enchanted forest: towering ancient trees with mossy trunks, soft glowing fairy lights floating in the air, dappled sunlight filtering through the canopy'
			},
			{
				name: 'Outer space',
				description: 'Floating among stars and nebulae',
				fragment:
					'outer space: a vast starfield with colorful nebulae, a nearby planet visible in the distance, and the soft glow of distant galaxies'
			},
			{
				name: 'Cozy cabin',
				description: 'Warm interior with fireplace',
				fragment:
					'the interior of a cozy log cabin: a crackling stone fireplace, warm wood walls, a plush rug on the floor, and soft ambient lighting'
			},
			{
				name: 'Red carpet',
				description: 'Hollywood premiere with photographers',
				fragment:
					'a Hollywood red carpet event: velvet rope barriers, bright camera flashes, a step-and-repeat backdrop with logos'
			},
			{
				name: 'Japanese garden',
				description: 'Serene zen garden with cherry blossoms',
				fragment:
					'a traditional Japanese zen garden: raked gravel patterns, a red wooden bridge over a koi pond, cherry blossom trees in full bloom'
			},
			{
				name: 'Underwater',
				description: 'Deep ocean with coral reefs',
				fragment:
					'an underwater scene: vibrant coral reef, tropical fish swimming by, rays of sunlight filtering through the water surface above'
			}
		]
	}
];
