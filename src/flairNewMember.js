import flairs from "./flairs"

let newMembers = []
let notNewMembers = []

let suspendedUsers = []
let notSuspended = []

const FETCH_CONFIG = {
	method: "GET",
}

const CLASS_NAME = "-!--checked-newmember-flair"

async function handlePost(post) {
	if (!post) return false

	if (!post.classList.contains(CLASS_NAME)) {
		post.className += ` ${CLASS_NAME}`
		const { amNewMember, postData } = await isNewMember(
			post.getAttribute("data-user-id"),
			post.getAttribute("data-post-id")
		)

		const amSuspended = await isSuspended(post.getAttribute("data-user-id"), postData).catch(
			console.error
		)

		if (amNewMember) flairs.addFlair(post, "newMember")
		if (amSuspended) flairs.addFlair(post, "suspended")
	}
}

async function isNewMember(userId, postId) {
	if (newMembers.indexOf(userId) != -1) return true
	if (notNewMembers.indexOf(userId) != -1) return false

	const res = await fetch(`https://devforum.roblox.com/posts/${postId}.json`, FETCH_CONFIG)

	if (!res.ok) {
		return false // throw new Error(`HTTP error! Status: ${res.status}`)
	}

	const blob = await res.blob()
	const post = JSON.parse(await blob.text())

	if (post.trust_level !== 1 || post.staff === true) {
		notNewMembers.push(userId)
		return { amNewMember: false, postData: post }
	} else {
		newMembers.push(userId)
		return { amNewMember: true, postData: post }
	}
}

async function isSuspended(userId, post) {
	if (suspendedUsers.indexOf(userId) != -1) return true
	if (notSuspended.indexOf(userId) != -1) return false

	const res = await fetch(`https://devforum.roblox.com/u/${post.username}.json`, FETCH_CONFIG)

	if (!res.ok) {
		throw new Error(`HTTP error! Status: ${res.status}`)
	}

	const blob = await res.blob()
	const user = JSON.parse(await blob.text())

	if (user.user.suspended_till) {
		suspendedUsers.push(userId)
		return true
	} else {
		notSuspended.push(userId)
		return false
	}
}

export default function flairNewMember() {
	setInterval(() => {
		for (let post of document.getElementsByTagName("article")) {
			handlePost(post).catch(console.error)
		}
	}, 1000)
}
